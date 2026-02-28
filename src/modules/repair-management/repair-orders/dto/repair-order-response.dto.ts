import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RepairOrder,
  RepairStatus,
  UrgencyLevel,
  Customer,
  RepairOrderImage,
  RepairOrderComment,
  RepairOrderStatusHistory,
  User,
} from '@prisma/client';

// ─── Nested DTOs ──────────────────────────────────────────────────────────────

export class RepairOrderCustomerDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() phone: string;
  @ApiPropertyOptional() email: string | null;
}

export class RepairOrderImageDto {
  @ApiProperty() id: string;
  @ApiProperty() fileKey: string;
}

export class RepairOrderCommentDto {
  @ApiProperty() id: string;
  @ApiProperty() message: string;
  @ApiProperty() internal: boolean;
  @ApiPropertyOptional() authorName: string | null;
  @ApiProperty() createdAt: Date;
}

export class RepairOrderStatusHistoryDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ enum: RepairStatus }) previousStatus: RepairStatus | null;
  @ApiProperty({ enum: RepairStatus }) newStatus: RepairStatus;
  @ApiProperty() timestamp: Date;
}

// ─── Relation types ───────────────────────────────────────────────────────────

type OrderWithRelations = RepairOrder & {
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'email'> | null;
  images?: RepairOrderImage[];
  comments?: (RepairOrderComment & {
    author?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
  })[];
  statusHistory?: RepairOrderStatusHistory[];
};

// ─── Main DTO ─────────────────────────────────────────────────────────────────

export class RepairOrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiProperty() customerId: string;
  @ApiProperty() deviceModel: string;
  @ApiProperty() issueDescription: string;
  @ApiProperty({ enum: RepairStatus }) status: RepairStatus;
  @ApiProperty({ enum: UrgencyLevel }) urgencyLevel: UrgencyLevel;
  @ApiPropertyOptional() costEstimate: number | null;
  @ApiPropertyOptional() finalPrice: number | null;
  @ApiProperty() isApproved: boolean;
  @ApiProperty() publicTrackingToken: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() completedAt: Date | null;
  @ApiPropertyOptional() approvedAt: Date | null;

  // ─── Optional relations (included in detail view) ─────────────────────────
  @ApiPropertyOptional({ type: RepairOrderCustomerDto })
  customer?: RepairOrderCustomerDto | null;

  @ApiPropertyOptional({ type: [RepairOrderImageDto] })
  images?: RepairOrderImageDto[];

  @ApiPropertyOptional({ type: [RepairOrderCommentDto] })
  comments?: RepairOrderCommentDto[];

  @ApiPropertyOptional({ type: [RepairOrderStatusHistoryDto] })
  statusHistory?: RepairOrderStatusHistoryDto[];

  static fromEntity(order: OrderWithRelations): RepairOrderResponseDto {
    const dto = new RepairOrderResponseDto();
    dto.id = order.id;
    dto.companyId = order.companyId;
    dto.customerId = order.customerId;
    dto.deviceModel = order.deviceModel;
    dto.issueDescription = order.issueDescription;
    dto.status = order.status;
    dto.urgencyLevel = order.urgencyLevel;
    dto.costEstimate = order.costEstimate ? Number(order.costEstimate) : null;
    dto.finalPrice = order.finalPrice ? Number(order.finalPrice) : null;
    dto.isApproved = order.isApproved;
    dto.publicTrackingToken = order.publicTrackingToken;
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    dto.completedAt = order.completedAt ?? null;
    dto.approvedAt = order.approvedAt ?? null;

    if (order.customer !== undefined) {
      dto.customer = order.customer
        ? {
            id: order.customer.id,
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email ?? null,
          }
        : null;
    }

    if (order.images) {
      dto.images = order.images.map((img) => ({ id: img.id, fileKey: img.fileKey }));
    }

    if (order.comments) {
      dto.comments = order.comments.map((c) => ({
        id: c.id,
        message: c.message,
        internal: c.internal,
        authorName: c.author ? `${c.author.firstName} ${c.author.lastName}` : null,
        createdAt: c.createdAt,
      }));
    }

    if (order.statusHistory) {
      dto.statusHistory = order.statusHistory.map((h) => ({
        id: h.id,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        timestamp: h.timestamp,
      }));
    }

    return dto;
  }
}
