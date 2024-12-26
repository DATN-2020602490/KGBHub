import BigNumber from "bignumber.js";
import { BaseController } from "../../abstractions/base.controller";
import { KGBRequest, KGBResponse } from "../../util/global";

export default class ReportMockController extends BaseController {
  public path = "/api/v1/reports";

  public initializeRoutes() {
    this.router.get(`/system`, this.getMockSystemReport);
    this.router.get(`/author`, this.getMockAuthorReport);
  }

  private randomNumber(min: number, max: number, int = false): number {
    return BigNumber(
      BigNumber(Math.random() * (max - min) + min).toFixed(int ? 0 : 2),
    ).toNumber();
  }

  private generateDates(
    startDate: Date,
    endDate: Date,
    groupBy: string,
  ): string[] {
    const dates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (groupBy === "day") {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (groupBy === "month") {
        dates.push(currentDate.toISOString().slice(0, 7));
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (groupBy === "year") {
        dates.push(currentDate.toISOString().slice(0, 4));
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }
    return dates;
  }

  private validateDateRange(
    startDate: Date,
    endDate: Date,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    if (endDate > now) endDate = now;
    if (startDate > endDate)
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  }

  getMockSystemReport = async (req: KGBRequest, res: KGBResponse) => {
    const groupBy = req.gp<string>("groupBy", "day", ["day", "month", "year"]);
    let startDate = new Date(
      req.gp<string | Date>("startDate", new Date(0), String),
    );
    let endDate = new Date(
      req.gp<string | Date>("endDate", new Date(), String),
    );

    ({ startDate, endDate } = this.validateDateRange(startDate, endDate));

    const dates = this.generateDates(startDate, endDate, groupBy);
    const mockData = dates.reduce((acc, date) => {
      const totalOriginalAmount = this.randomNumber(50000, 100000);
      acc[date] = {
        totalOriginalAmount,
        totalAmount: this.randomNumber(
          totalOriginalAmount * (2 / 3),
          totalOriginalAmount,
        ),
        totalOrder: this.randomNumber(500, 1000, true),
        totalFee: BigNumber(
          BigNumber(totalOriginalAmount * 0.05).toFixed(2),
        ).toNumber(),
        totalTip: this.randomNumber(
          totalOriginalAmount * (2 / 3) * 0.15,
          totalOriginalAmount * 0.15,
        ),
      };
      return acc;
    }, {} as Record<string, any>);

    return res.status(200).data({
      groupBy,
      startDate,
      endDate,
      target: "system",
      systemReport: mockData,
    });
  };

  getMockAuthorReport = async (req: KGBRequest, res: KGBResponse) => {
    const groupBy = req.gp<string>("groupBy", "day", ["day", "month", "year"]);
    let startDate = new Date(
      req.gp<string | Date>("startDate", new Date(0), String),
    );
    let endDate = new Date(
      req.gp<string | Date>("endDate", new Date(), String),
    );

    ({ startDate, endDate } = this.validateDateRange(startDate, endDate));

    const periods = this.generateDates(startDate, endDate, groupBy);
    const mockData = periods.reduce((acc, period) => {
      const totalOriginalAmount = this.randomNumber(500, 3000);
      acc[period] = {
        totalOriginalAmount,
        totalAmount: this.randomNumber(
          totalOriginalAmount * (2 / 3),
          totalOriginalAmount,
        ),
        totalOrder: this.randomNumber(5, 50, true),
      };
      return acc;
    }, {} as Record<string, any>);

    return res.status(200).data({
      groupBy,
      startDate,
      endDate,
      target: "author",
      authorId: "12345",
      author: {
        id: "12345",
        name: "Author Mock",
        email: "author.mock@example.com",
      },
      authorReport: mockData,
    });
  };
}
