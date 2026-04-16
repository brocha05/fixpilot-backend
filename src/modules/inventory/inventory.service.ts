import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ListProductsDto,
  ProductResponseDto,
} from './dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(
    companyId: string,
    dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.create({
        data: {
          companyId,
          branchId: dto.branchId ?? null,
          name: dto.name,
          description: dto.description ?? null,
          sku: dto.sku ?? null,
          category: dto.category ?? null,
          price: dto.price,
          cost: dto.cost ?? 0,
          stock: dto.stock ?? 0,
          minStock: dto.minStock ?? 0,
          unit: dto.unit ?? 'pza',
          status: dto.status ?? 'ACTIVE',
        },
      });
      return ProductResponseDto.fromEntity(product);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un producto con ese SKU en esta empresa',
        );
      }
      throw err;
    }
  }

  // ─── List ─────────────────────────────────────────────────────────────────────

  async findAll(companyId: string, query: ListProductsDto) {
    const { page = 1, limit = 20, search, status, lowStock, category } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      deletedAt: null,
      ...(status && { status }),
      ...(category && {
        category: { contains: category, mode: 'insensitive' },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    let items = products.map(ProductResponseDto.fromEntity);

    if (lowStock) {
      items = items.filter((p) => p.isLowStock);
    }

    return {
      data: items,
      total: lowStock ? items.length : total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // ─── Find One ─────────────────────────────────────────────────────────────────

  async findOne(companyId: string, id: string): Promise<ProductResponseDto> {
    return ProductResponseDto.fromEntity(await this.findOrThrow(companyId, id));
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  async update(
    companyId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    await this.findOrThrow(companyId, id);

    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.sku !== undefined && { sku: dto.sku }),
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.cost !== undefined && { cost: dto.cost }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.minStock !== undefined && { minStock: dto.minStock }),
          ...(dto.unit !== undefined && { unit: dto.unit }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.branchId !== undefined && { branchId: dto.branchId ?? null }),
        },
      });
      return ProductResponseDto.fromEntity(updated);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un producto con ese SKU en esta empresa',
        );
      }
      throw err;
    }
  }

  // ─── Remove ───────────────────────────────────────────────────────────────────

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOrThrow(companyId, id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async findOrThrow(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  // ─── Internal: adjust stock (used by SalesService) ───────────────────────────

  async decrementStock(
    productId: string,
    quantity: number,
    tx: any,
  ): Promise<void> {
    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });
  }

  async incrementStock(
    productId: string,
    quantity: number,
    tx: any,
  ): Promise<void> {
    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });
  }

  async getLowStockCount(companyId: string): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { companyId, deletedAt: null, status: 'ACTIVE' },
      select: { stock: true, minStock: true },
    });
    return products.filter((p) => p.stock <= p.minStock).length;
  }
}
