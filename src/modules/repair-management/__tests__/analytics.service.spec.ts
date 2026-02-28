/**
 * AnalyticsService — Unit Tests
 *
 * Verifies revenue, expense, and repair stats calculations using mocked Prisma.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RepairStatus } from '@prisma/client';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeDecimal(value: number) {
  return { toNumber: () => value, toString: () => String(value) };
}

const mockPrisma = {
  repairOrder: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  expense: {
    groupBy: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  // ─── Revenue ────────────────────────────────────────────────────────────────

  describe('getRevenueSummary', () => {
    it('calculates total revenue from completed orders (finalPrice takes priority)', async () => {
      mockPrisma.repairOrder.findMany
        .mockResolvedValueOnce([
          // Completed orders
          { finalPrice: makeDecimal(1500), costEstimate: makeDecimal(1200) },
          { finalPrice: null, costEstimate: makeDecimal(800) },
          { finalPrice: makeDecimal(2000), costEstimate: null },
        ])
        .mockResolvedValueOnce([
          // Pending orders
          { costEstimate: makeDecimal(600) },
          { costEstimate: null },
        ]);

      const result = await service.getRevenueSummary('company-1', 2024, 6);

      // 1500 (finalPrice) + 800 (fallback costEstimate) + 2000 (finalPrice) = 4300
      expect(result.totalRevenue).toBe(4300);
      // 600 + 0 = 600
      expect(result.pendingRevenue).toBe(600);
      expect(result.period).toEqual({ year: 2024, month: 6 });
    });

    it('returns 0 revenue when no completed orders exist', async () => {
      mockPrisma.repairOrder.findMany
        .mockResolvedValueOnce([])  // completed
        .mockResolvedValueOnce([]); // pending

      const result = await service.getRevenueSummary('company-1', 2024);

      expect(result.totalRevenue).toBe(0);
      expect(result.pendingRevenue).toBe(0);
    });
  });

  // ─── Repair Stats ────────────────────────────────────────────────────────────

  describe('getRepairStats', () => {
    it('builds byStatus map with zeros for statuses with no records', async () => {
      mockPrisma.repairOrder.groupBy.mockResolvedValue([
        { status: RepairStatus.PENDING, _count: { id: 5 } },
        { status: RepairStatus.COMPLETED, _count: { id: 3 } },
        { status: RepairStatus.DELIVERED, _count: { id: 2 } },
      ]);
      mockPrisma.$queryRaw.mockResolvedValue([{ avg_hours: 24.5 }]);

      const result = await service.getRepairStats('company-1');

      expect(result.byStatus[RepairStatus.PENDING]).toBe(5);
      expect(result.byStatus[RepairStatus.COMPLETED]).toBe(3);
      expect(result.byStatus[RepairStatus.DELIVERED]).toBe(2);
      // Statuses with no data should be 0, not undefined
      expect(result.byStatus[RepairStatus.IN_PROGRESS]).toBe(0);
      expect(result.byStatus[RepairStatus.CANCELLED]).toBe(0);
      expect(result.total).toBe(10);
      expect(result.completed).toBe(5); // COMPLETED + DELIVERED
      expect(result.avgRepairTimeHours).toBe(24.5);
    });

    it('returns null avgRepairTimeHours when no completed orders', async () => {
      mockPrisma.repairOrder.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ avg_hours: null }]);

      const result = await service.getRepairStats('company-1');

      expect(result.avgRepairTimeHours).toBeNull();
    });
  });

  // ─── Expense Stats ───────────────────────────────────────────────────────────

  describe('getExpenseSummary', () => {
    it('aggregates expenses by category', async () => {
      mockPrisma.expense.groupBy.mockResolvedValue([
        { category: 'PARTS', _sum: { amount: makeDecimal(3000) } },
        { category: 'TOOLS', _sum: { amount: makeDecimal(500) } },
        { category: 'SHIPPING', _sum: { amount: makeDecimal(250.5) } },
      ]);

      const result = await service.getExpenseSummary('company-1', 2024, 1);

      expect(result.byCategory['PARTS']).toBe(3000);
      expect(result.byCategory['TOOLS']).toBe(500);
      expect(result.byCategory['SHIPPING']).toBe(250.5);
      expect(result.totalExpenses).toBeCloseTo(3750.5, 2);
      expect(result.period).toEqual({ year: 2024, month: 1 });
    });

    it('returns 0 total when no expenses', async () => {
      mockPrisma.expense.groupBy.mockResolvedValue([]);

      const result = await service.getExpenseSummary('company-1', 2024);

      expect(result.totalExpenses).toBe(0);
      expect(result.byCategory).toEqual({});
    });
  });

  // ─── Net Profit ──────────────────────────────────────────────────────────────

  describe('getDashboardSummary (net profit)', () => {
    it('calculates netProfit as revenue minus expenses', async () => {
      // Stub individual methods
      jest.spyOn(service, 'getRevenueSummary').mockResolvedValue({
        totalRevenue: 10000,
        pendingRevenue: 2000,
        period: { year: 2024, month: 1 },
      });
      jest.spyOn(service, 'getRepairStats').mockResolvedValue({
        total: 20,
        byStatus: {} as never,
        completed: 15,
        avgRepairTimeHours: 8,
      });
      jest.spyOn(service, 'getExpenseSummary').mockResolvedValue({
        totalExpenses: 3500,
        byCategory: {},
        period: { year: 2024, month: 1 },
      });

      const result = await service.getDashboardSummary('company-1');

      expect(result.netProfit).toBe(6500); // 10000 - 3500
    });
  });
});
