import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RepairStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRepairOrderDto,
  UpdateRepairOrderDto,
  ChangeStatusDto,
  AddCommentDto,
  ListRepairOrdersDto,
  RepairOrderResponseDto,
} from './dto';
import {
  isTransitionAllowed,
  REPAIR_STATUS_LABELS_ES,
} from './domain/status-transitions';
import {
  RepairEvent,
  RepairStatusChangedEvent,
  RepairApprovalRequestedEvent,
  RepairCompletedEvent,
} from './events/repair.events';

export interface PaginatedRepairOrders {
  data: RepairOrderResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Prisma include shapes ────────────────────────────────────────────────────

const DETAIL_INCLUDE = {
  customer: { select: { id: true, name: true, phone: true, email: true } },
  images: true,
  comments: {
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  statusHistory: { orderBy: { timestamp: 'asc' as const } },
} as const;

const LIST_INCLUDE = {
  customer: { select: { id: true, name: true, phone: true, email: true } },
} as const;

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RepairOrdersService {
  private readonly logger = new Logger(RepairOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Create ─────────────────────────────────────────────────────────────────

  async create(
    dto: CreateRepairOrderDto,
    companyId: string,
    userId: string,
  ): Promise<RepairOrderResponseDto> {
    // Validate customer belongs to this company
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const publicTrackingToken = randomBytes(32).toString('hex');

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.repairOrder.create({
        data: {
          companyId,
          customerId: dto.customerId,
          deviceModel: dto.deviceModel,
          issueDescription: dto.issueDescription,
          urgencyLevel: dto.urgencyLevel ?? 'NORMAL',
          costEstimate: dto.costEstimate ?? null,
          publicTrackingToken,
        },
      });

      await tx.repairOrderStatusHistory.create({
        data: {
          orderId: created.id,
          previousStatus: null,
          newStatus: RepairStatus.PENDING,
          changedBy: userId,
        },
      });

      return created;
    });

    this.logger.log(
      `RepairOrder created: ${order.id} for company: ${companyId}`,
    );

    return RepairOrderResponseDto.fromEntity({
      ...order,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
    });
  }

  // ─── List ────────────────────────────────────────────────────────────────────

  async findAll(
    companyId: string,
    filters: ListRepairOrdersDto,
  ): Promise<PaginatedRepairOrders> {
    const {
      page = 1,
      limit = 20,
      skip,
      status,
      urgencyLevel,
      customerId,
      fromDate,
      toDate,
    } = filters;

    const where = {
      companyId,
      ...(status ? { status } : {}),
      ...(urgencyLevel ? { urgencyLevel } : {}),
      ...(customerId ? { customerId } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate + 'T23:59:59.999Z') } : {}),
            },
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.repairOrder.findMany({
        where,
        include: LIST_INCLUDE,
        skip,
        take: limit,
        orderBy: [{ urgencyLevel: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.repairOrder.count({ where }),
    ]);

    return {
      data: orders.map(RepairOrderResponseDto.fromEntity),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // ─── Detail ──────────────────────────────────────────────────────────────────

  async findById(
    id: string,
    companyId: string,
  ): Promise<RepairOrderResponseDto> {
    const order = await this.prisma.repairOrder.findFirst({
      where: { id, companyId },
      include: DETAIL_INCLUDE,
    });
    if (!order)
      throw new NotFoundException('Orden de reparación no encontrada');

    return RepairOrderResponseDto.fromEntity(order);
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateRepairOrderDto,
    companyId: string,
  ): Promise<RepairOrderResponseDto> {
    const order = await this.findOrderOrThrow(id, companyId);

    if (
      order.status === RepairStatus.DELIVERED ||
      order.status === RepairStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'No se puede modificar una orden que ya fue entregada o cancelada',
      );
    }

    const updated = await this.prisma.repairOrder.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.isApproved === true && !order.isApproved
          ? { approvedAt: new Date() }
          : {}),
      },
      include: DETAIL_INCLUDE,
    });

    return RepairOrderResponseDto.fromEntity(updated);
  }

  // ─── Change Status ────────────────────────────────────────────────────────────

  async changeStatus(
    id: string,
    dto: ChangeStatusDto,
    companyId: string,
    userId: string,
  ): Promise<RepairOrderResponseDto> {
    const order = await this.findOrderOrThrow(id, companyId);

    if (!isTransitionAllowed(order.status, dto.status)) {
      throw new BadRequestException(
        `Transición de estado no permitida: de "${REPAIR_STATUS_LABELS_ES[order.status]}" a "${REPAIR_STATUS_LABELS_ES[dto.status]}"`,
      );
    }

    const now = new Date();
    const statusUpdates: Record<string, unknown> = {
      status: dto.status,
      ...(dto.status === RepairStatus.APPROVED
        ? { isApproved: true, approvedAt: now }
        : {}),
      ...(dto.status === RepairStatus.COMPLETED ? { completedAt: now } : {}),
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.repairOrder.update({
        where: { id },
        data: statusUpdates,
        include: {
          ...DETAIL_INCLUDE,
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
      });

      await tx.repairOrderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: order.status,
          newStatus: dto.status,
          changedBy: userId,
        },
      });

      // Optional internal note on status change
      if (dto.note) {
        await tx.repairOrderComment.create({
          data: {
            orderId: id,
            authorId: userId,
            message: dto.note,
            internal: true,
          },
        });
      }

      return result;
    });

    this.logger.log(
      `Order ${id} status changed: ${order.status} → ${dto.status} by user ${userId}`,
    );

    // ─── Emit domain events ─────────────────────────────────────────────────
    const customerEmail = updated.customer?.email ?? null;
    const customerName = updated.customer?.name ?? '';

    if (dto.status === RepairStatus.WAITING_APPROVAL) {
      const event = new RepairApprovalRequestedEvent();
      event.orderId = id;
      event.companyId = companyId;
      event.customerName = customerName;
      event.customerEmail = customerEmail;
      event.deviceModel = updated.deviceModel;
      event.costEstimate = updated.costEstimate
        ? Number(updated.costEstimate)
        : null;
      event.publicTrackingToken = updated.publicTrackingToken;
      this.eventEmitter.emit(RepairEvent.APPROVAL_REQUESTED, event);
    } else if (dto.status === RepairStatus.COMPLETED) {
      const event = new RepairCompletedEvent();
      event.orderId = id;
      event.companyId = companyId;
      event.customerName = customerName;
      event.customerEmail = customerEmail;
      event.deviceModel = updated.deviceModel;
      event.finalPrice = updated.finalPrice ? Number(updated.finalPrice) : null;
      event.publicTrackingToken = updated.publicTrackingToken;
      this.eventEmitter.emit(RepairEvent.COMPLETED, event);
    } else {
      const event = new RepairStatusChangedEvent();
      event.orderId = id;
      event.companyId = companyId;
      event.customerName = customerName;
      event.customerEmail = customerEmail;
      event.deviceModel = updated.deviceModel;
      event.previousStatus = order.status;
      event.newStatus = dto.status;
      event.publicTrackingToken = updated.publicTrackingToken;
      this.eventEmitter.emit(RepairEvent.STATUS_CHANGED, event);
    }

    return RepairOrderResponseDto.fromEntity(updated);
  }

  // ─── Comments ─────────────────────────────────────────────────────────────────

  async addComment(
    id: string,
    dto: AddCommentDto,
    companyId: string,
    userId: string,
  ): Promise<{
    id: string;
    message: string;
    internal: boolean;
    createdAt: Date;
  }> {
    await this.findOrderOrThrow(id, companyId);

    const comment = await this.prisma.repairOrderComment.create({
      data: {
        orderId: id,
        authorId: userId,
        message: dto.message,
        internal: dto.internal ?? false,
      },
    });

    return {
      id: comment.id,
      message: comment.message,
      internal: comment.internal,
      createdAt: comment.createdAt,
    };
  }

  // ─── Images ───────────────────────────────────────────────────────────────────

  async addImage(
    id: string,
    fileKey: string,
    companyId: string,
  ): Promise<{ id: string; fileKey: string }> {
    await this.findOrderOrThrow(id, companyId);

    const image = await this.prisma.repairOrderImage.create({
      data: { orderId: id, fileKey },
    });

    return { id: image.id, fileKey: image.fileKey };
  }

  async removeImage(
    id: string,
    imageId: string,
    companyId: string,
  ): Promise<void> {
    await this.findOrderOrThrow(id, companyId);

    const image = await this.prisma.repairOrderImage.findFirst({
      where: { id: imageId, orderId: id },
    });
    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.prisma.repairOrderImage.delete({ where: { id: imageId } });
  }

  // ─── Public tracking (no auth) ────────────────────────────────────────────────

  async findByToken(token: string) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { publicTrackingToken: token },
      include: {
        customer: { select: { name: true } },
        statusHistory: {
          select: { newStatus: true, timestamp: true },
          orderBy: { timestamp: 'asc' },
        },
        // Only public comments (internal: false)
        comments: {
          where: { internal: false },
          select: { message: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order)
      throw new NotFoundException(
        'Token de seguimiento inválido o no encontrado',
      );

    // Return only public-safe fields — never expose companyId, financial data, internal info
    return {
      deviceModel: order.deviceModel,
      issueDescription: order.issueDescription,
      status: order.status,
      urgencyLevel: order.urgencyLevel,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      customer: { name: order.customer.name },
      statusHistory: order.statusHistory.map((h) => ({
        status: h.newStatus,
        timestamp: h.timestamp,
      })),
      publicComments: order.comments,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private async findOrderOrThrow(id: string, companyId: string) {
    const order = await this.prisma.repairOrder.findFirst({
      where: { id, companyId },
    });
    if (!order)
      throw new NotFoundException('Orden de reparación no encontrada');
    return order;
  }
}
