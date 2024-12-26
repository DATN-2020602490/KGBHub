import { BaseController } from "../../abstractions/base.controller";
import express from "express";
import stripe from "../../configs/stripe";
import {
  KGBRequest,
  KGBResponse,
  limitDefault,
  offsetDefault,
  userSelector,
} from "../../util/global";
import {
  checkout,
  estimate,
  notPaidCourses,
  onStripeHook,
} from "./stripe.service";
import { ProductType } from "@prisma/client";
import HttpException from "../../exceptions/http-exception";
import { KGBAuth } from "../../configs/passport";

export default class StripeController extends BaseController {
  public path = "/api/v1/stripe";

  public initializeRoutes() {
    this.router.post(
      "/webhook",
      express.raw({ type: "application/json" }),
      this.handleWebhook,
    );
    this.router.post("/buy-course", KGBAuth("jwt"), this.buyCourse);
    this.router.post(
      "/checkout-from-cart",
      KGBAuth("jwt"),
      this.checkoutFromCart,
    );
    this.router.get("/orders", this.getOrders);
    this.router.get("/orders/:id", this.getOrder);
    this.router.post("/estimate", KGBAuth("jwt"), this.estimate);
  }

  handleWebhook = async (req: KGBRequest, res: KGBResponse) => {
    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig as string | string[],
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );

    onStripeHook(event, this.io).then((error) => {
      console.error("paymentService.onStripeHook error", error);
    });

    return res.status(200).data({ received: true });
  };

  buyCourse = async (req: KGBRequest, res: KGBResponse) => {
    const courseId = req.gp<string>("courseId", undefined, String);
    req.body.courseIds = [courseId];
    checkout(req, res);
  };

  checkoutFromCart = async (req: KGBRequest, res: KGBResponse) => {
    checkout(req, res);
  };

  getOrders = async (req: KGBRequest, res: KGBResponse) => {
    const limit = req.gp<number>("limit", limitDefault, Number);
    const offset = req.gp<number>("offset", offsetDefault, Number);
    const userId = req.gp<string>("userId", null, String);
    const where = {};
    if (userId) {
      where["userId"] = userId;
    }
    const orders = await this.prisma.order.findMany({
      where,
      include: { user: userSelector },
      take: limit,
      skip: offset,
      orderBy: { updatedAt: "desc" },
    });
    for (const order of orders) {
      order.amount = order.amount + order.platformFee + order.KGBHubServiceTip;
    }
    const total = await this.prisma.order.count({ where });
    return res.status(200).data(orders, total);
  };

  getOrder = async (req: KGBRequest, res: KGBResponse) => {
    const id = req.gp<string>("id", undefined, String);
    const order = await this.prisma.order.findFirst({
      where: { id },
      include: {
        user: userSelector,
        productOrders: { include: { product: true } },
      },
    });

    const tipProduct = order.productOrders.find(
      (po) => po.product.type === ProductType.KGBHUB_SERVICE_TIP,
    );
    const platformFeeProduct = order.productOrders.find(
      (po) => po.product.type === ProductType.STRIPE_SERVICE_FEE,
    );
    const elseProducts = order.productOrders.filter(
      (po) =>
        po.product.type !== ProductType.KGBHUB_SERVICE_TIP &&
        po.product.type !== ProductType.STRIPE_SERVICE_FEE,
    );
    order.productOrders = [tipProduct, platformFeeProduct, ...elseProducts];
    return res.status(200).data(order);
  };

  estimate = async (req: KGBRequest, res: KGBResponse) => {
    const reqUser = req.user;
    let { courseIds } = req.body;
    if (courseIds instanceof String) {
      courseIds = JSON.parse(courseIds as string);
    }
    courseIds = await notPaidCourses(reqUser.id, courseIds);
    if (courseIds.length === 0) {
      throw new HttpException(400, "Courses already paid");
    }
    const tipPercent = req.gp<number>("tipPercent", 0, Number);
    const code = req.gp<string>("code", null, String);
    const {
      amount,
      fee,
      tip,
      voucherAmount,
      discountAmount,
      originalAmount,
      originalFee,
    } = await estimate(reqUser.id, courseIds, tipPercent, code);
    return res.status(200).data({
      originalAmount: originalAmount.toNumber(),
      originalFee: originalFee.toNumber(),
      amount: amount.toNumber(),
      fee: fee.toNumber(),
      tip: tip.toNumber(),
      voucherAmount: voucherAmount.toNumber(),
      discountAmount: discountAmount.toNumber(),
    });
  };
}
