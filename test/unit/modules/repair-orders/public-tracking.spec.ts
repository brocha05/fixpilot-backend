/**
 * Public Tracking Security — Unit Tests
 *
 * Verifies:
 * 1. Valid tokens return only public-safe fields
 * 2. Invalid/missing tokens throw NotFoundException
 * 3. Internal comments are never exposed
 * 4. Financial data is never exposed
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RepairOrdersService } from 'src/modules/repair-orders/repair-orders.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RepairStatus, UrgencyLevel } from '@prisma/client';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const VALID_TOKEN = 'a'.repeat(64); // 64-char hex (all 'a' for simplicity)

function makeOrder() {
  return {
    id: 'order-1',
    companyId: 'company-1', // must NOT appear in public response
    customerId: 'customer-1',
    deviceModel: 'iPhone 14 Pro',
    issueDescription: 'Pantalla rota',
    status: RepairStatus.IN_PROGRESS,
    urgencyLevel: UrgencyLevel.HIGH,
    costEstimate: { toNumber: () => 1500 }, // must NOT appear in public response
    finalPrice: null, // must NOT appear in public response
    isApproved: true,
    publicTrackingToken: VALID_TOKEN,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    completedAt: null,
    approvedAt: new Date('2024-01-01'),
    customer: { name: 'Juan Pérez' },
    statusHistory: [
      { newStatus: RepairStatus.PENDING, timestamp: new Date('2024-01-01') },
      {
        newStatus: RepairStatus.IN_PROGRESS,
        timestamp: new Date('2024-01-02'),
      },
    ],
    comments: [
      // Only internal: false comments come from the DB query in findByToken
      {
        message: 'Revisión inicial completada',
        createdAt: new Date('2024-01-01'),
      },
    ],
  };
}

const mockPrisma = {
  repairOrder: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  customer: { findFirst: jest.fn() },
  repairOrderStatusHistory: { create: jest.fn() },
  repairOrderComment: { create: jest.fn() },
  repairOrderImage: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RepairOrdersService — Public Tracking', () => {
  let service: RepairOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepairOrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<RepairOrdersService>(RepairOrdersService);
    jest.clearAllMocks();
  });

  describe('findByToken', () => {
    it('returns public-safe fields for a valid token', async () => {
      mockPrisma.repairOrder.findUnique.mockResolvedValue(makeOrder());

      const result = await service.findByToken(VALID_TOKEN);

      expect(result.deviceModel).toBe('iPhone 14 Pro');
      expect(result.status).toBe(RepairStatus.IN_PROGRESS);
      expect(result.customer.name).toBe('Juan Pérez');
      expect(result.statusHistory).toHaveLength(2);
      expect(result.publicComments).toHaveLength(1);
    });

    it('never exposes companyId in the result', async () => {
      mockPrisma.repairOrder.findUnique.mockResolvedValue(makeOrder());

      const result = await service.findByToken(VALID_TOKEN);

      expect(result).not.toHaveProperty('companyId');
    });

    it('never exposes financial data (costEstimate, finalPrice)', async () => {
      mockPrisma.repairOrder.findUnique.mockResolvedValue(makeOrder());

      const result = await service.findByToken(VALID_TOKEN);

      expect(result).not.toHaveProperty('costEstimate');
      expect(result).not.toHaveProperty('finalPrice');
    });

    it('throws NotFoundException for an unknown token', async () => {
      mockPrisma.repairOrder.findUnique.mockResolvedValue(null);

      await expect(service.findByToken(VALID_TOKEN)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('calls findUnique with the exact publicTrackingToken', async () => {
      mockPrisma.repairOrder.findUnique.mockResolvedValue(makeOrder());

      await service.findByToken(VALID_TOKEN);

      expect(mockPrisma.repairOrder.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { publicTrackingToken: VALID_TOKEN },
        }),
      );
    });

    it('only requests non-internal comments from the DB', async () => {
      mockPrisma.repairOrder.findUnique.mockResolvedValue(makeOrder());

      await service.findByToken(VALID_TOKEN);

      const callArgs = mockPrisma.repairOrder.findUnique.mock.calls[0][0];
      // The include for comments must filter internal: false
      expect(callArgs.include.comments.where).toEqual({ internal: false });
    });
  });
});
