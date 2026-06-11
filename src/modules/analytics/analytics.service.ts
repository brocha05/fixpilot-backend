import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RepairStatus, SaleStatus } from '@prisma/client';

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

export interface InventoryCostSummary {
  totalCost: number;
  byCategory: Record<string, number>;
  period: { year: number; month?: number };
}

export interface SalesSummary {
  totalSales: number;
  salesCount: number;
  period: { year: number; month?: number };
}

export interface DashboardSummary {
  revenue: RevenueSummary;
  repairs: RepairStats;
  inventoryCosts: InventoryCostSummary;
  sales: SalesSummary;
  lowStockCount: number;
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

  // ─── Inventory Cost Stats ───────────────────────────────────────────────────

  async getInventoryCostSummary(
    companyId: string,
    year: number,
    month?: number,
  ): Promise<InventoryCostSummary> {
    const dateRange = this.buildDateRange(year, month);

    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          companyId,
          status: SaleStatus.COMPLETED,
          createdAt: dateRange,
        },
      },
      select: {
        quantity: true,
        product: { select: { cost: true, category: true } },
      },
    });

    const byCategory: Record<string, number> = {};
    let totalCost = 0;

    for (const item of saleItems) {
      const category = item.product.category ?? 'Sin categoria';
      const amount = Number(item.product.cost) * item.quantity;
      byCategory[category] = (byCategory[category] ?? 0) + amount;
      totalCost += amount;
    }

    for (const category of Object.keys(byCategory)) {
      byCategory[category] = Math.round(byCategory[category] * 100) / 100;
    }

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      byCategory,
      period: { year, month },
    };
  }

  // ─── Dashboard Summary ───────────────────────────────────────────────────────

  async getDashboardSummary(companyId: string): Promise<DashboardSummary> {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const [revenue, repairs, inventoryCosts, sales, lowStockCount] =
      await Promise.all([
        this.getRevenueSummary(companyId, year, month),
        this.getRepairStats(companyId),
        this.getInventoryCostSummary(companyId, year, month),
        this.getSalesSummary(companyId, year, month),
        this.getLowStockCount(companyId),
      ]);

    const netProfit =
      Math.round(
        (revenue.totalRevenue + sales.totalSales - inventoryCosts.totalCost) *
          100,
      ) / 100;

    return {
      revenue,
      repairs,
      inventoryCosts,
      sales,
      lowStockCount,
      netProfit,
    };
  }

  // ─── Sales Summary ───────────────────────────────────────────────────────────

  async getSalesSummary(
    companyId: string,
    year: number,
    month?: number,
  ): Promise<SalesSummary> {
    const dateRange = this.buildDateRange(year, month);

    const result = await this.prisma.sale.aggregate({
      where: { companyId, status: SaleStatus.COMPLETED, createdAt: dateRange },
      _sum: { finalAmount: true },
      _count: { id: true },
    });

    return {
      totalSales: Math.round(Number(result._sum.finalAmount ?? 0) * 100) / 100,
      salesCount: result._count.id,
      period: { year, month },
    };
  }

  // ─── Low Stock ───────────────────────────────────────────────────────────────

  async getLowStockCount(companyId: string): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { companyId, deletedAt: null, status: 'ACTIVE' },
      select: { stock: true, minStock: true },
    });
    return products.filter((p) => p.stock <= p.minStock).length;
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
