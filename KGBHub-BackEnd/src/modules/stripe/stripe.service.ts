import {
  OrderStatus,
  ProductType,
  Currency,
  PaymentPlatform,
  VoucherType,
  ChatMemberRole,
  UserView,
} from "@prisma/client";
import prisma from "../../prisma";
import stripe from "../../configs/stripe";
import BigNumber from "bignumber.js";
import { toLower } from "lodash";
import {
  KGBRequest,
  KGBResponse,
  Order,
  userSelector,
  Voucher,
} from "../../util/global";
import IO from "../../socket/io";
import { findX } from "../report/report.service";
import PaymentSuccessEmail from "../../email/templates/order.paid";
import { render } from "@react-email/render";
import sendEmail from "../../email/process";
import HttpException from "../../exceptions/http-exception";

export const onStripeHook = async (event: any, io: IO) => {
  const STATUS_MAP = {
    "checkout.session.async_payment_failed": OrderStatus.FAILED,
    "checkout.session.async_payment_succeeded": OrderStatus.SUCCESS,
    "checkout.session.completed": OrderStatus.SUCCESS,
    "checkout.session.expired": OrderStatus.EXPIRED,
    "invoice.paid": OrderStatus.SUCCESS,
  } as any;

  console.log("onStripeHook", event);

  let where: any = {};

  if (event.type === "invoice.paid") {
    where = {
      stripeSubscriptionId: event.data.object.subscription,
    };
  } else {
    where = {
      stripePriceId: event.data.object.line_items?.data[0]?.price?.id,
      stripeCheckoutId: event.data.object.id,
    };
  }

  const order = await prisma.order.findFirst({ where });
  const status = STATUS_MAP[event.type];

  if (!order || !status) {
    return;
  }

  await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      status,
      stripeSubscriptionId: event.data.object.subscription,
    },
  });

  if (order.status !== OrderStatus.SUCCESS && status === OrderStatus.SUCCESS) {
    onOrderPaid(order as Order, io);
  }
};

export const onOrderPaid = async (order: Order, io: IO) => {
  try {
    const coursesPaids = await prisma.coursesPaid.findMany({
      where: { orderId: order.id },
    });
    for (const coursePaid of coursesPaids) {
      const courses = await prisma.course.findMany({
        where: { id: coursePaid.courseId },
        include: {
          conversations: {
            include: {
              messages: true,
              chatMembers: { include: { user: userSelector } },
            },
          },
        },
      });
      for (const course of courses) {
        await prisma.coursesOnCarts.deleteMany({
          where: {
            cart: { userId: order.userId },
            courseId: course.id,
          },
        });
        for (const conversation of course.conversations) {
          if (
            !conversation.chatMembers.find(
              (user) => user.userId === order.userId,
            )
          ) {
            const chatMember = await prisma.chatMember.create({
              data: {
                conversationId: conversation.id,
                userId: order.userId,
                chatMemberRole: ChatMemberRole.MEMBER,
              },
            });
            for (const user of conversation.chatMembers) {
              io.sendChatList(user.userId, conversation.id);
            }
            io.sendChatList(order.userId, conversation.id);
            for (const message of conversation.messages) {
              await prisma.chatMembersOnMessages.create({
                data: {
                  messageId: message.id,
                  chatMemberId: chatMember.id,
                  readAt: new Date(),
                  read: true,
                  forceRead: true,
                  userView: UserView.RECEIVER,
                },
              });
            }
          }
        }
      }
    }
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
    });
    const orderX = (await prisma.order.findFirst({
      where: {
        id: order.id,
      },
      include: { productOrders: { include: { product: true } } },
    })) as Order;
    const html = render(
      PaymentSuccessEmail({
        userFirstName: user?.firstName,
        userLastName: user?.lastName,
        order: orderX,
      }),
    );
    await sendEmail(html, user?.email as string, "Payment Success");
  } catch (error) {
    console.error("onOrderPaid error:", error);
  }
};

export const updateOrderStatus = async (io: IO) => {
  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
    },
  });

  for (const order of orders) {
    let status: OrderStatus;

    const session = await stripe.checkout.sessions.retrieve(
      order.stripeCheckoutId as string,
    );

    if (session.status === "complete") {
      if (session.payment_status === "paid") {
        status = OrderStatus.SUCCESS;
      }

      if (session.payment_status === "unpaid") {
        status = OrderStatus.FAILED;
      }
    } else if (session.status === "expired") {
      status = OrderStatus.EXPIRED;
    } else if (session.status === "open") {
      continue;
    }

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status,
      },
    });

    if (
      order.status !== OrderStatus.SUCCESS &&
      status === OrderStatus.SUCCESS
    ) {
      onOrderPaid(order as Order, io);
    }
  }
};

export const getPriceForTip = async (
  amount: BigNumber,
  tipPercent: number,
  currency = Currency.USD,
) => {
  amount = BigNumber(amount.toFixed(2)).times(tipPercent / 100);
  let tipProduct = await prisma.product.findFirst({
    where: {
      type: ProductType.KGBHUB_SERVICE_TIP,
    },
  });
  if (!tipProduct) {
    const newProduct = await stripe.products.create({
      name: "KGBHub Service Tip",
      description: "This amount will be used to support KGBHub service",
      active: true,
      default_price_data: {
        currency: currency,
        unit_amount: BigNumber(0).times(100).toNumber(),
      },
    });
    tipProduct = await prisma.product.create({
      data: {
        productStripeId: String(newProduct.id),
        type: ProductType.KGBHUB_SERVICE_TIP,
        name: "KGBHub Service Tip",
        description: "This amount will be used to support KGBHub service",
        price: 0,
        currency: currency,
      },
    });
  }
  const product = await stripe.products.retrieve(tipProduct.productStripeId);
  const prices = await stripe.prices.list({ product: product.id });
  for (const price of prices.data) {
    if (
      BigNumber(price.unit_amount_decimal).div(100).isEqualTo(amount) &&
      toLower(price.currency) === toLower(currency)
    ) {
      return price;
    }
  }

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount_decimal: BigNumber(amount).times(100).toFixed(0),
    currency: currency,
    active: true,
  });
  return price;
};

export const getPlatformFee = async (
  amount: BigNumber,
  currency = Currency.USD,
  platform = PaymentPlatform.STRIPE,
  percent = 0,
) => {
  const originalFee = amount.times(5).dividedBy(100);
  const fee = amount
    .times(0.05)
    .times(100 - percent)
    .dividedBy(100);

  let _ =
    platform === PaymentPlatform.STRIPE
      ? await prisma.product.findFirst({
          where: { type: ProductType.STRIPE_SERVICE_FEE },
        })
      : null;
  if (!_ && platform === PaymentPlatform.STRIPE) {
    const newProduct = await stripe.products.create({
      name: "Stripe Service Fee",
      description: "This amount will be used to pay for Stripe service",
      active: true,
      default_price_data: {
        currency: currency,
        unit_amount: BigNumber(0).times(100).toNumber(),
      },
    });
    _ = await prisma.product.create({
      data: {
        productStripeId: String(newProduct.id),
        type: ProductType.STRIPE_SERVICE_FEE,
        name: "Stripe Service Fee",
        description: "This amount will be used to pay for Stripe service",
        price: 0,
        currency: currency,
      },
    });
  }
  const product = await stripe.products.retrieve(_.productStripeId);
  if (!product) {
    return null;
  }
  const prices = (await stripe.prices.list({ product: product.id })).data;
  const price = prices.find((p) => BigNumber(p.unit_amount).isEqualTo(fee));
  if (!price) {
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount_decimal: BigNumber(fee).times(100).toFixed(0),
      currency,
    });
    return { originalFee, price };
  }
  return { price, originalFee };
};

export const getPriceIdInProduct = async (
  productStripeId: string,
  amount: BigNumber,
  currency = Currency.USD,
) => {
  const product = await stripe.products.retrieve(productStripeId);
  if (!product) {
    return null;
  }
  const prices = (await stripe.prices.list({ product: product.id })).data;
  const price = prices.find((p) =>
    BigNumber(p.unit_amount).isEqualTo(amount.times(100).toNumber()),
  );
  if (!price) {
    const newPrice = await stripe.prices.create({
      product: product.id,
      unit_amount_decimal: amount.times(100).toFixed(0),
      currency,
    });
    return newPrice;
  }
  return price;
};

export const createLineItems = async (
  userId: string,
  courseIds: string[],
  tipPercent: number,
  code?: string,
) => {
  const line_items = [] as { price: string; quantity: number }[];
  let voucher: Voucher = null;
  if (code) {
    voucher = await prisma.voucher.findFirst({
      where: { code, campaign: { active: true } },
    });
  }
  // for (const courseId of courseIds) {
  //   const course = await prisma.course.findUnique({
  //     where: { id: courseId },
  //     include: { products: true },
  //   });
  //   if (!course) {
  //     continue;
  //   }
  //   if (BigNumber(course.priceAmount).isEqualTo(0)) {
  //     await prisma.coursesPaid.create({
  //       data: {
  //         course: { connect: { id: courseId } },
  //         user: { connect: { id: userId } },
  //         isFree: true,
  //       },
  //     });
  //     courseIds.splice(courseIds.indexOf(courseId), 1);
  //   }
  // }
  if (!courseIds.length) {
    return {
      line_items: [],
      platformFee: null,
      tip: null,
      totalAmount: 0,
      originalAmount: 0,
      originalFee: 0,
    };
  }
  const discountProduct = voucher
    ? voucher.type === VoucherType.PRODUCT_PERCENTAGE
    : false;
  let totalAmount = BigNumber(0);
  let originalAmount = BigNumber(0);
  for (const courseId of courseIds) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { products: true },
    });
    if (!course) {
      continue;
    }
    const campaignDiscount = await prisma.campaignDiscount.findFirst({
      where: { courseId, campaign: { active: true } },
      include: { campaign: true },
      orderBy: { value: "desc" },
    });
    let isDiscountFromCampaign = false;
    if (campaignDiscount) {
      if (
        await prisma.campaignUser.findFirst({
          where: { campaignId: campaignDiscount.campaignId, userId },
        })
      ) {
        isDiscountFromCampaign = true;
      }
    }
    const product = course.products[0];
    let latestPrice = BigNumber(course.priceAmount);
    originalAmount = originalAmount.plus(latestPrice);
    if (discountProduct) {
      latestPrice = BigNumber(course.priceAmount)
        .times(100 - voucher.value)
        .dividedBy(100);
    }
    if (isDiscountFromCampaign) {
      latestPrice = BigNumber(course.priceAmount)
        .times(100 - campaignDiscount.value)
        .dividedBy(100);
    }

    const priceId = await getPriceIdInProduct(
      product.productStripeId,
      latestPrice,
    );
    totalAmount = totalAmount.plus(latestPrice);
    line_items.push({
      price: priceId.id as string,
      quantity: 1,
    });
  }
  const feeDiscount = voucher
    ? voucher.type === VoucherType.FEE_PERCENTAGE
    : false;

  const { price: platformFee, originalFee } = await getPlatformFee(
    BigNumber(totalAmount),
    Currency.USD,
    PaymentPlatform.STRIPE,
    feeDiscount ? voucher.value : 0,
  );
  line_items.push({
    price: platformFee.id as string,
    quantity: 1,
  });
  const tip = await getPriceForTip(BigNumber(totalAmount), tipPercent);
  line_items.push({
    price: tip.id as string,
    quantity: 1,
  });
  if (voucher) {
    await prisma.voucher.update({
      where: { id: voucher.id },
      data: { isUsed: true },
    });
  }
  return {
    line_items,
    platformFee,
    tip,
    totalAmount,
    originalAmount,
    originalFee,
  };
};

export const notPaidCourses = async (userId: string, courseIds: string[]) => {
  const notPaidCourses = [];
  for (const courseId of courseIds) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      continue;
    }
    const isBought = await prisma.coursesPaid.findFirst({
      where: {
        courseId,
        userId,
        order: { status: OrderStatus.SUCCESS },
      },
    });
    if (isBought) {
      continue;
    }
    notPaidCourses.push(courseId);
  }
  return notPaidCourses;
};

export const bindingPriceForProductOrder = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      coursesPaids: { include: { course: { include: { products: true } } } },
      productOrders: true,
    },
  });
  if (!order) {
    return;
  }
  if (order.productOrders.length > 0) {
    await prisma.productOrder.deleteMany({
      where: { orderId: id },
    });
  }
  const tipProduct = await prisma.product.findFirst({
    where: { type: ProductType.KGBHUB_SERVICE_TIP },
  });
  await prisma.productOrder.create({
    data: {
      productId: tipProduct.id,
      orderId: id,
      quantity: 1,
      price: order.KGBHubServiceTip,
    },
  });
  const stripeFeeProduct = await prisma.product.findFirst({
    where: { type: ProductType.STRIPE_SERVICE_FEE },
  });
  await prisma.productOrder.create({
    data: {
      productId: stripeFeeProduct.id,
      price: order.platformFee,
      quantity: 1,
      orderId: id,
    },
  });

  for (const coursePaid of order.coursesPaids) {
    const salePrice = findX(
      coursePaid.course.priceAmount,
      order.originalAmount,
      order.amount,
    );
    await prisma.productOrder.create({
      data: {
        productId: coursePaid.course.products[0].id,
        quantity: 1,
        orderId: id,
        price: BigNumber(BigNumber(salePrice).toFixed(2)).toNumber(),
      },
    });
  }
};

export const estimate = async (
  userId: string,
  courseIds: string[],
  tipPercent: number,
  code?: string,
) => {
  let voucher: Voucher = null;
  if (code) {
    voucher = await prisma.voucher.findFirst({
      where: {
        code,
        campaign: { active: true },
        campaignUser: { userId: userId },
      },
    });
  }

  let totalAmount = BigNumber(0);
  let originalAmount = BigNumber(0);
  const feeDiscount = voucher
    ? voucher.type === VoucherType.FEE_PERCENTAGE
    : false;
  const resVoucher = voucher
    ? {
        amount: BigNumber(0),
      }
    : null;
  const resDiscount = {
    amount: BigNumber(0),
  };
  for (const courseId of courseIds) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { products: true },
    });
    if (!course) {
      continue;
    }
    const campaignDiscount = await prisma.campaignDiscount.findFirst({
      where: { courseId, campaign: { active: true } },
      include: { campaign: true },
      orderBy: { value: "desc" },
    });

    let isDiscountFromCampaign = false;
    if (campaignDiscount) {
      if (
        await prisma.campaignUser.findFirst({
          where: { campaignId: campaignDiscount.campaignId, userId },
        })
      ) {
        isDiscountFromCampaign = true;
      }
    }

    const product = course.products[0];
    let latestPrice = BigNumber(course.priceAmount);
    originalAmount = originalAmount.plus(latestPrice);

    // Apply voucher discount if it's a product percentage discount
    if (voucher && voucher.type === VoucherType.PRODUCT_PERCENTAGE) {
      latestPrice = BigNumber(course.priceAmount)
        .times(100 - voucher.value)
        .dividedBy(100);
      resVoucher.amount = resVoucher.amount.plus(
        BigNumber(course.priceAmount).minus(latestPrice),
      );
    }

    // Apply campaign discount if applicable
    if (isDiscountFromCampaign) {
      latestPrice = BigNumber(course.priceAmount)
        .times(100 - campaignDiscount.value)
        .dividedBy(100);
      resDiscount.amount = resDiscount.amount.plus(
        BigNumber(course.priceAmount).minus(latestPrice),
      );
    }

    totalAmount = totalAmount.plus(latestPrice);
  }

  // Estimate the platform fee
  const { price: platformFee } = await getPlatformFee(
    BigNumber(totalAmount),
    Currency.USD,
    PaymentPlatform.STRIPE,
    feeDiscount ? voucher.value : 0,
  );
  const orgFee = BigNumber(totalAmount).times(5).dividedBy(100);
  if (voucher) {
    const disFee = BigNumber(totalAmount)
      .times(5)
      .dividedBy(100)
      .times(feeDiscount ? 100 - voucher.value : 0)
      .dividedBy(100);
    resVoucher.amount = resVoucher.amount.plus(orgFee.minus(disFee));
  }
  // originalAmount = originalAmount.plus(orgFee);

  // Estimate the tip
  const tip = await getPriceForTip(BigNumber(totalAmount), tipPercent);
  // originalAmount = originalAmount.plus(
  //   BigNumber(tip.unit_amount_decimal).dividedBy(100),
  // );

  return {
    originalAmount: originalAmount,
    originalFee: BigNumber(originalAmount).times(5).dividedBy(100),
    amount: totalAmount,
    fee: BigNumber(platformFee.unit_amount_decimal).dividedBy(100),
    tip: BigNumber(tip.unit_amount_decimal).dividedBy(100),
    voucherAmount: resVoucher
      ? resVoucher.amount.lte(BigNumber(0))
        ? BigNumber(0)
        : resVoucher.amount
      : BigNumber(0),
    discountAmount: resDiscount
      ? resDiscount.amount.lte(BigNumber(0))
        ? BigNumber(0)
        : resDiscount.amount
      : BigNumber(0),
  };
};

export const checkout = async (req: KGBRequest, res: KGBResponse) => {
  const reqUser = req.user;
  const code = req.gp<string>("code", null, String);
  let { courseIds } = req.body;
  if (courseIds instanceof String) {
    courseIds = JSON.parse(courseIds as string);
  }
  courseIds = await notPaidCourses(reqUser.id, courseIds);
  if (courseIds.length === 0) {
    throw new HttpException(400, "Courses already paid");
  }
  const tipPercent = req.gp<number>("tipPercent", 0, Number);
  const {
    line_items,
    platformFee,
    tip,
    totalAmount,
    originalAmount,
    originalFee,
  } = await createLineItems(req.user.id, courseIds, tipPercent, code);

  const success_url = req.gp<string>(
    "successUrl",
    process.env.PUBLIC_URL,
    String,
  );
  const checkout = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    success_url,
    expires_at: Math.floor(Date.now() / 1000) + 35 * 60,
  });
  const order = await prisma.order.create({
    data: {
      platformFee: BigNumber(platformFee.unit_amount_decimal)
        .div(100)
        .toNumber(),
      KGBHubServiceTip: tip
        ? BigNumber(tip.unit_amount_decimal).div(100).toNumber()
        : 0,
      amount: BigNumber(totalAmount).toNumber(),
      currency: Currency.USD,
      status: OrderStatus.PENDING,
      expiresAt: new Date(checkout.expires_at * 1000),
      user: { connect: { id: reqUser.id } },
      stripeCheckoutId: checkout.id,
      checkoutUrl: checkout.url,
      originalAmount: BigNumber(originalAmount).toNumber(),
      originalFee: BigNumber(originalFee).toNumber(),
    },
  });
  for (const _ of courseIds) {
    await prisma.coursesPaid.create({
      data: {
        course: { connect: { id: _ } },
        user: { connect: { id: reqUser.id } },
        order: { connect: { id: order.id } },
      },
    });
  }
  res.status(200).data(order);
  await bindingPriceForProductOrder(order.id);
};
