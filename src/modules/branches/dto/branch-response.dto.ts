import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BranchStatus, Branch } from '@prisma/client';

export class BranchResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() phone: string | null;
  @ApiPropertyOptional() email: string | null;
  @ApiProperty() address: string;
  @ApiProperty() city: string;
  @ApiProperty() state: string;
  @ApiPropertyOptional() zipCode: string | null;
  @ApiProperty() country: string;
  @ApiProperty({ enum: BranchStatus }) status: BranchStatus;
  @ApiProperty() isMain: boolean;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() deletedAt: Date | null;

  static fromEntity(branch: Branch): BranchResponseDto {
    const dto = new BranchResponseDto();
    dto.id = branch.id;
    dto.companyId = branch.companyId;
    dto.name = branch.name;
    dto.phone = branch.phone ?? null;
    dto.email = branch.email ?? null;
    dto.address = branch.address;
    dto.city = branch.city;
    dto.state = branch.state;
    dto.zipCode = branch.zipCode ?? null;
    dto.country = branch.country;
    dto.status = branch.status;
    dto.isMain = branch.isMain;
    dto.notes = branch.notes ?? null;
    dto.createdAt = branch.createdAt;
    dto.updatedAt = branch.updatedAt;
    dto.deletedAt = branch.deletedAt ?? null;
    return dto;
  }
}
