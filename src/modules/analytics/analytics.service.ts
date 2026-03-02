import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RepairStatus } from '@prisma/client';

// ─── Response Shapes ─────────────────────────────────────────────────────────

export interface RevenueSummary {
  totalRevenue: number;
  pendingRevenue: number;
  period: { year: number; month?: number };
}

export interface RepairStats {
  total: number;
  byStatus: Record<RepairStatus, number>;
  completed: number;
  avgRepairTimeHours: number | null;
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Record<string, number>;
  period: { year: number; month?: number };
}

export interface DashboardSummary {
  revenue: RevenueSummary;
  repairs: RepairStats;
  expenses: ExpenseSummary;
  netProfit: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Revenue ────────────────────────────────────────────────────────────────

  async getRevenueSummary(
    companyId: string,
    year: number,
    month?: number,
  ): Promise<RevenueSummary> {
    const dateRange = this.buildDateRange(year, month);

    // Revenue from COMPLETED + DELIVERED orders (finalPrice preferred, fallback costEstimate)
    const completedOrders = await this.prisma.repairOrder.findMany({
      where: {
        companyId,
        status: { in: [RepairStatus.COMPLETED, RepairStatus.DELIVERED] },
        completedAt: dateRange,
      },
      select: { finalPrice: true, costEstimate: true },
    });

    const totalRevenue = completedOrders.reduce((sum, o) => {
      const price = o.finalPrice ?? o.costEstimate ?? 0;
      return sum + Number(price);
    }, 0);

    // Pending revenue from orders still in progress (costEstimate)
    const pendingOrders = await this.prisma.repairOrder.findMany({
      where: {
        companyId,
        status: {
          notIn: [
            RepairStatus.COMPLETED,
            RepairStatus.DELIVERED,
            RepairStatus.CANCELLED,
          ],
        },
      },
      select: { costEstimate: true },
    });

    const pendingRevenue = pendingOrders.reduce(
      (sum, o) => sum + Number(o.costEstimate ?? 0),
      0,
    );

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingRevenue: Math.round(pendingRevenue * 100) / 100,
      period: { year, month },
    };
  }

  // ─── Repair Stats ────────────────────────────────────────────────────────────

  async getRepairStats(companyId: string): Promise<RepairStats> {
    const grouped = await this.prisma.repairOrder.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
    });

    const byStatus = Object.values(RepairStatus).reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {} as Record<RepairStatus, number>,
    );

    for (const g of grouped) {
      byStatus[g.status] = g._count.id;
    }

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const completed =
      byStatus[RepairStatus.COMPLETED] + byStatus[RepairStatus.DELIVERED];

    // Average repair time via raw SQL for precision
    const avgResult = await this.prisma.$queryRaw<
      { avg_hours: number | null }[]
    >`
      SELECT
        AVG(
          EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0
        ) AS avg_hours
      FROM repair_orders
      WHERE company_id = ${companyId}::uuid
        AND completed_at IS NOT NULL
        AND status IN ('COMPLETED', 'DELIVERED')
    `;

    const avgRepairTimeHours =
      avgResult[0]?.avg_hours != null
        ? Math.round(Number(avgResult[0].avg_hours) * 10) / 10
        : null;

    return { total, byStatus, completed, avgRepairTimeHours };
  }

  // ─── Expense Stats ───────────────────────────────────────────────────────────

  async getExpenseSummary(
    companyId: string,
    year: number,
    month?: number,
  ): Promise<ExpenseSummary> {
    const dateRange = this.buildDateRange(year, month);

    const grouped = await this.prisma.expense.groupBy({
      by: ['category'],
      where: { companyId, createdAt: dateRange },
      _sum: { amount: true },
    });

    const byCategory: Record<string, number> = {};
    let totalExpenses = 0;

    for (const g of grouped) {
      const amount = Math.round(Number(g._sum.amount ?? 0) * 100) / 100;
      byCategory[g.category] = amount;
      totalExpenses += amount;
    }

    return {
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      byCategory,
      period: { year, month },
    };
  }

  // ─── Dashboard Summary ───────────────────────────────────────────────────────

  async getDashboardSummary(companyId: string): Promise<DashboardSummary> {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const [revenue, repairs, expenses] = await Promise.all([
      this.getRevenueSummary(companyId, year, month),
      this.getRepairStats(companyId),
      this.getExpenseSummary(companyId, year, month),
    ]);

    const netProfit =
      Math.round((revenue.totalRevenue - expenses.totalExpenses) * 100) / 100;

    return { revenue, repairs, expenses, netProfit };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private buildDateRange(year: number, month?: number) {
    if (month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      return { gte: start, lte: end };
    }
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { gte: start, lte: end };
  }
}
