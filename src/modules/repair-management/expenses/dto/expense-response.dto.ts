import { ApiProperty } from '@nestjs/swagger';
import { Expense, ExpenseCategory } from '@prisma/client';

export class ExpenseResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiProperty() description: string;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: ExpenseCategory }) category: ExpenseCategory;
  @ApiProperty() createdAt: Date;

  static fromEntity(expense: Expense): ExpenseResponseDto {
    const dto = new ExpenseResponseDto();
    dto.id = expense.id;
    dto.companyId = expense.companyId;
    dto.description = expense.description;
    dto.amount = Number(expense.amount);
    dto.category = expense.category;
    dto.createdAt = expense.createdAt;
    return dto;
  }
}
