import BigNumber from "bignumber.js";
import {
  CoursesPaid,
  GLOBAL_REVENUE_SHARE,
  Order,
  ReportData,
} from "../../util/global";

export const groupOrdersByDate = (
  orders: any[],
  groupBy: string,
  isSystem = true,
) => {
  const result = orders.reduce((acc, order) => {
    const dateKey = getDateKey(order.updatedAt, groupBy);
    if (!acc[dateKey]) {
      acc[dateKey] = {
        totalOriginalAmount: BigNumber(0),
        totalAmount: BigNumber(0),
        totalOrder: BigNumber(0),
      };
      if (isSystem) {
        acc[dateKey]["totalFee"] = BigNumber(0);
        acc[dateKey]["totalTip"] = BigNumber(0);
      }
    }
    acc[dateKey].totalOrder = BigNumber(acc[dateKey].totalOrder).plus(1);
    acc[dateKey].totalOriginalAmount = BigNumber(
      acc[dateKey].totalOriginalAmount,
    ).plus(order.originalAmount);
    acc[dateKey].totalAmount = BigNumber(acc[dateKey].totalAmount).plus(
      order.amount,
    );
    if (isSystem) {
      acc[dateKey].totalFee = BigNumber(acc[dateKey].totalFee).plus(
        order.platformFee,
      );
      acc[dateKey].totalTip = BigNumber(acc[dateKey].totalTip).plus(order.tip);
    }
    for (const key in acc[dateKey]) {
      if (key === "totalOrder") {
        acc[dateKey][key] = acc[dateKey][key].toNumber();
      }
      acc[dateKey][key] = BigNumber(acc[dateKey][key].toFixed(2)).toNumber();
    }
    return acc;
  }, {});

  const sortedData = Object.fromEntries(
    Object.entries(result).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
  ) as ReportData;
  return sortedData;
};

export const getDateKey = (date: Date, groupBy: string) => {
  const isoDate = date.toISOString().split("T")[0];
  if (groupBy === "day") {
    return isoDate;
  }
  if (groupBy === "month") {
    return isoDate.slice(0, 7);
  }
  if (groupBy === "year") {
    return isoDate.slice(0, 4);
  }
  return null;
};

export const processOrdersReportAuthor = (
  coursesPaids: CoursesPaid[],
  groupBy: string,
) => {
  const orders = [] as Order[];
  for (const coursePaid of coursesPaids) {
    const order = {
      updatedAt: coursePaid.order.updatedAt,
    } as Order;
    const salePrice = findX(
      coursePaid.course.priceAmount,
      coursePaid.order.originalAmount,
      coursePaid.order.amount,
    );
    order.amount = salePrice * GLOBAL_REVENUE_SHARE;
    order.originalAmount = coursePaid.course.priceAmount * GLOBAL_REVENUE_SHARE;
    orders.push(order);
  }
  return groupOrdersByDate(orders, groupBy, false);
};

/**
 * Solves for x in the equation ax = by, given a, b, and y.
 *
 * @param a - The coefficient of x in the equation.
 * @param b - The coefficient of y in the equation. Must be non-zero.
 * @param y - The value of y in the equation.
 * @throws {Error} If b is zero.
 * @returns The value of x.
 */
export function findX(a: number, b: number, y: number) {
  try {
    return isNaN((a * y) / b) ? 0 : (a * y) / b;
  } catch {
    return 0;
  }
}
