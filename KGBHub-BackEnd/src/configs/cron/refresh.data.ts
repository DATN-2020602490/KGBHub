import { CronJob } from "cron";
import prisma from "../../prisma";
import { refreshCourse } from "../../modules/course/course.service";
import { OrderStatus } from "@prisma/client";

const refreshCart = async () => {
  const carts = await prisma.cart.findMany({});
  for (const cart of carts) {
    const coursePaids = await prisma.coursesPaid.findMany({
      where: { userId: cart.userId, order: { status: OrderStatus.SUCCESS } },
    });
    for (const coursePaid of coursePaids) {
      await prisma.coursesOnCarts.deleteMany({
        where: {
          cartId: cart.id,
          courseId: coursePaid.courseId,
        },
      });
    }
  }
};

const RefreshData = new CronJob(
  "0 */5 * * * *",
  async function () {
    await refreshCart();
    const courses = await prisma.course.findMany();
    for (const _ of courses) {
      try {
        await refreshCourse(_.id);
      } catch (e) {
        console.log("At course id: ", _.id);
        console.log(e);
      }
    }
  },
  null,
  false,
);

export default RefreshData;
