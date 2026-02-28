import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
} from './dto';

export interface PaginatedCustomers {
  data: CustomerResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, companyId: string): Promise<CustomerResponseDto> {
    if (dto.phone) {
      const existing = await this.prisma.customer.findFirst({
        where: { companyId, phone: dto.phone },
      });
      if (existing) {
        throw new ConflictException(
          'Ya existe un cliente con ese número de teléfono en tu empresa',
        );
      }
    }

    const customer = await this.prisma.customer.create({
      data: { ...dto, companyId },
    });

    this.logger.log(`Customer created: ${customer.id} for company: ${companyId}`);
    return CustomerResponseDto.fromEntity(customer);
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    search?: string,
  ): Promise<PaginatedCustomers> {
    const { page = 1, limit = 20, skip } = pagination;

    const where = {
      companyId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map(CustomerResponseDto.fromEntity),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, companyId: string): Promise<CustomerResponseDto> {
    const customer = await this.findOrThrow(id, companyId);
    return CustomerResponseDto.fromEntity(customer);
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    companyId: string,
  ): Promise<CustomerResponseDto> {
    await this.findOrThrow(id, companyId);

    if (dto.phone) {
      const conflict = await this.prisma.customer.findFirst({
        where: { companyId, phone: dto.phone, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          'Ya existe un cliente con ese número de teléfono en tu empresa',
        );
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    return CustomerResponseDto.fromEntity(updated);
  }

  async remove(id: string, companyId: string): Promise<void> {
    await this.findOrThrow(id, companyId);

    const activeOrders = await this.prisma.repairOrder.count({
      where: {
        customerId: id,
        companyId,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
    });

    if (activeOrders > 0) {
      throw new ConflictException(
        'No se puede eliminar un cliente con órdenes de reparación activas',
      );
    }

    await this.prisma.customer.delete({ where: { id } });
    this.logger.log(`Customer deleted: ${id}`);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async findOrThrow(id: string, companyId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }
}
