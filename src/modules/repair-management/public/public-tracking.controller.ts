import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { Public } from '../../../common/decorators/public.decorator';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import { REPAIR_STATUS_LABELS_ES, URGENCY_LABELS_ES } from '../domain/status-transitions';

@ApiTags('Seguimiento Público')
@Public()
@Controller('public')
export class PublicTrackingController {
  constructor(private readonly repairOrdersService: RepairOrdersService) {}

  /**
   * GET /public/track/:token
   *
   * Public endpoint — no authentication required.
   * Returns only client-safe fields: device info, status, public comments, status history.
   * Internal comments, financials, and companyId are never exposed.
   */
  @Get('track/:token')
  @ApiOperation({
    summary: 'Seguimiento público de orden por token seguro',
    description:
      'No requiere autenticación. Devuelve información segura para el cliente: estado, historial y comentarios públicos.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token de seguimiento de 64 caracteres (hex)',
    example: 'a1b2c3d4e5f6...',
  })
  async trackOrder(@Param('token') token: string) {
    // Validate token format (64-char hex) before hitting the DB
    if (!/^[a-f0-9]{64}$/.test(token)) {
      // Uniform error regardless of reason — no format hints leaked
      throw new NotFoundException('Token de seguimiento inválido o no encontrado');
    }

    const order = await this.repairOrdersService.findByToken(token);

    return {
      deviceModel: order.deviceModel,
      issueDescription: order.issueDescription,
      status: order.status,
      statusLabel: REPAIR_STATUS_LABELS_ES[order.status],
      urgencyLevel: order.urgencyLevel,
      urgencyLabel: URGENCY_LABELS_ES[order.urgencyLevel],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      customer: order.customer,
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        statusLabel: REPAIR_STATUS_LABELS_ES[h.status],
        timestamp: h.timestamp,
      })),
      publicComments: order.publicComments,
    };
  }
}
