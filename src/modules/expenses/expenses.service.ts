import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseResponseDto,
  ListExpensesDto,
} from './dto';

export interface PaginatedExpenses {
  data: ExpenseResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateExpenseDto,
    companyId: string,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.prisma.expense.create({
      data: { ...dto, companyId },
    });

    this.logger.log(`Expense created: ${expense.id} for company: ${companyId}`);
    return ExpenseResponseDto.fromEntity(expense);
  }

  async findAll(
    companyId: string,
    query: ListExpensesDto,
  ): Promise<PaginatedExpenses> {
    const { page = 1, limit = 20, skip, category, fromDate, toDate } = query;

    const where = {
      companyId,
      ...(category ? { category } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate + 'T23:59:59.999Z') } : {}),
            },
          }
        : {}),
    };

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses.map(ExpenseResponseDto.fromEntity),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, companyId: string): Promise<ExpenseResponseDto> {
    const expense = await this.findOrThrow(id, companyId);
    return ExpenseResponseDto.fromEntity(expense);
  }

  async update(
    id: string,
    dto: UpdateExpenseDto,
    companyId: string,
  ): Promise<ExpenseResponseDto> {
    await this.findOrThrow(id, companyId);

    const updated = await this.prisma.expense.update({
      where: { id },
      data: dto,
    });

    return ExpenseResponseDto.fromEntity(updated);
  }

  async remove(id: string, companyId: string): Promise<void> {
    await this.findOrThrow(id, companyId);
    await this.prisma.expense.delete({ where: { id } });
    this.logger.log(`Expense deleted: ${id}`);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async findOrThrow(id: string, companyId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, companyId },
    });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    return expense;
  }
}
