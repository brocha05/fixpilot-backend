import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';
import { CreateSaleDto, ListSalesDto, SaleResponseDto } from './dto';

const SALE_INCLUDE = {
  items: {
    include: {
      product: { select: { id: true, name: true, unit: true, sku: true } },
    },
  },
  customer: { select: { id: true, name: true, phone: true } },
} as const;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(
    companyId: string,
    createdById: string,
    dto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    const productIds = dto.items.map((i) => i.productId);

    // Load all products in one query
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId, deletedAt: null },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Uno o más productos no fueron encontrados');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock and build items
    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        throw new UnprocessableEntityException(
          `Stock insuficiente para "${product.name}": disponible ${product.stock}, requerido ${item.quantity}`,
        );
      }
    }

    // Compute totals
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice ?? Number(product.price);
      const subtotal = unitPrice * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const totalAmount = itemsData.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = dto.discount ?? 0;
    const finalAmount = Math.max(0, totalAmount - discount);

    // Create sale + items + decrement stock in a single transaction
    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          companyId,
          branchId: dto.branchId ?? null,
          customerId: dto.customerId ?? null,
          createdById,
          totalAmount,
          discount,
          finalAmount,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes ?? null,
          items: {
            create: itemsData.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        },
        include: SALE_INCLUDE,
      });

      // Decrement stock for each item
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return SaleResponseDto.fromEntity(sale as any);
  }

  // ─── List ─────────────────────────────────────────────────────────────────────

  async findAll(companyId: string, query: ListSalesDto) {
    const { page = 1, limit = 20, status, paymentMethod } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      ...(status && { status }),
      ...(paymentMethod && { paymentMethod }),
    };

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: SALE_INCLUDE,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales.map((s) => SaleResponseDto.fromEntity(s as any)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // ─── Find One ─────────────────────────────────────────────────────────────────

  async findOne(companyId: string, id: string): Promise<SaleResponseDto> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, companyId },
      include: SALE_INCLUDE,
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return SaleResponseDto.fromEntity(sale as any);
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────────

  async cancel(companyId: string, id: string): Promise<SaleResponseDto> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.status !== SaleStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden cancelar ventas completadas',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.sale.update({
        where: { id },
        data: { status: SaleStatus.CANCELLED },
        include: SALE_INCLUDE,
      });

      // Restore stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return result;
    });

    return SaleResponseDto.fromEntity(updated as any);
  }

  // ─── Analytics helpers ────────────────────────────────────────────────────────

  async getSalesSummary(
    companyId: string,
    year: number,
    month?: number,
  ): Promise<{
    totalSales: number;
    salesCount: number;
    period: { year: number; month?: number };
  }> {
    const start = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const end = month
      ? new Date(year, month, 0, 23, 59, 59, 999)
      : new Date(year, 11, 31, 23, 59, 59, 999);

    const result = await this.prisma.sale.aggregate({
      where: {
        companyId,
        status: SaleStatus.COMPLETED,
        createdAt: { gte: start, lte: end },
      },
      _sum: { finalAmount: true },
      _count: { id: true },
    });

    return {
      totalSales: Math.round(Number(result._sum.finalAmount ?? 0) * 100) / 100,
      salesCount: result._count.id,
      period: { year, month },
    };
  }
}
