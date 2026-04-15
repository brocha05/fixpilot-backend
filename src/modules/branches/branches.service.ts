import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Branch } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  ListBranchesDto,
  BranchResponseDto,
} from './dto';

export interface PaginatedBranches {
  data: BranchResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateBranchDto,
    companyId: string,
  ): Promise<BranchResponseDto> {
    if (dto.isMain) {
      // Unset the current main branch inside a transaction
      await this.prisma.$transaction([
        this.prisma.branch.updateMany({
          where: { companyId, isMain: true, deletedAt: null },
          data: { isMain: false },
        }),
        this.prisma.branch.create({
          data: { ...dto, companyId },
        }),
      ]);

      // Re-fetch to return the newly created branch
      const created = await this.prisma.branch.findFirst({
        where: { companyId, name: dto.name, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      this.logger.log(
        `Branch created (main): ${created!.id} for company: ${companyId}`,
      );
      return BranchResponseDto.fromEntity(created!);
    }

    try {
      const branch = await this.prisma.branch.create({
        data: { ...dto, companyId },
      });
      this.logger.log(`Branch created: ${branch.id} for company: ${companyId}`);
      return BranchResponseDto.fromEntity(branch);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'Ya existe una sucursal con ese nombre en tu empresa',
        );
      }
      throw err;
    }
  }

  async findAll(
    companyId: string,
    query: ListBranchesDto,
  ): Promise<PaginatedBranches> {
    const { page = 1, limit = 20, skip, search, status } = query;

    const where = {
      companyId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { city: { contains: search, mode: 'insensitive' as const } },
              { state: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [branches, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: branches.map(BranchResponseDto.fromEntity),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, companyId: string): Promise<BranchResponseDto> {
    const branch = await this.findOrThrow(id, companyId);
    return BranchResponseDto.fromEntity(branch);
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    companyId: string,
  ): Promise<BranchResponseDto> {
    await this.findOrThrow(id, companyId);

    let updated: Branch;

    if (dto.isMain) {
      // Clear current main and update in one transaction
      const [, result] = await this.prisma.$transaction([
        this.prisma.branch.updateMany({
          where: { companyId, isMain: true, deletedAt: null, NOT: { id } },
          data: { isMain: false },
        }),
        this.prisma.branch.update({
          where: { id },
          data: dto,
        }),
      ]);
      updated = result;
    } else {
      try {
        updated = await this.prisma.branch.update({ where: { id }, data: dto });
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'P2002') {
          throw new ConflictException(
            'Ya existe una sucursal con ese nombre en tu empresa',
          );
        }
        throw err;
      }
    }

    return BranchResponseDto.fromEntity(updated);
  }

  async remove(id: string, companyId: string): Promise<void> {
    await this.findOrThrow(id, companyId);

    const activeOrders = await this.prisma.repairOrder.count({
      where: {
        branchId: id,
        companyId,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
    });

    if (activeOrders > 0) {
      throw new ConflictException(
        'No se puede eliminar una sucursal con órdenes de reparación activas',
      );
    }

    await this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Branch soft-deleted: ${id}`);
  }

  // Validates branch exists and belongs to the company — used by RepairOrdersService
  async validateBranchBelongsToCompany(
    id: string,
    companyId: string,
  ): Promise<void> {
    await this.findOrThrow(id, companyId);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async findOrThrow(id: string, companyId: string): Promise<Branch> {
    const branch = await this.prisma.branch.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }
}
