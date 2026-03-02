import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EmailService } from '../../notifications/email/email.service';
import {
  RepairEvent,
  RepairStatusChangedEvent,
  RepairApprovalRequestedEvent,
  RepairCompletedEvent,
} from './repair.events';
import { repairStatusChangedTemplate } from '../../notifications/email/templates/repair-status-changed.template';
import { repairApprovalRequestTemplate } from '../../notifications/email/templates/repair-approval-request.template';
import { repairCompletedTemplate } from '../../notifications/email/templates/repair-completed.template';
import { REPAIR_STATUS_LABELS_ES } from '../domain/status-transitions';

@Injectable()
export class RepairEventListeners {
  private readonly logger = new Logger(RepairEventListeners.name);

  constructor(private readonly email: EmailService) {}

  // ─── Status Changed ──────────────────────────────────────────────────────────

  @OnEvent(RepairEvent.STATUS_CHANGED, { async: true })
  async onStatusChanged(event: RepairStatusChangedEvent): Promise<void> {
    if (!event.customerEmail) return;

    try {
      const trackingUrl = `${this.email.appUrl}/track/${event.publicTrackingToken}`;
      const newStatusLabel =
        REPAIR_STATUS_LABELS_ES[event.newStatus] ?? event.newStatus;

      const template = repairStatusChangedTemplate({
        ...this.email.baseContext(),
        customerName: event.customerName,
        deviceModel: event.deviceModel,
        newStatusLabel,
        trackingUrl,
      });

      await this.email.send({
        event: RepairEvent.STATUS_CHANGED,
        to: event.customerEmail,
        ...template,
        companyId: event.companyId,
      });
    } catch (err) {
      this.logger.error('onStatusChanged handler failed', (err as Error).stack);
    }
  }

  // ─── Approval Requested ──────────────────────────────────────────────────────

  @OnEvent(RepairEvent.APPROVAL_REQUESTED, { async: true })
  async onApprovalRequested(
    event: RepairApprovalRequestedEvent,
  ): Promise<void> {
    if (!event.customerEmail) return;

    try {
      const trackingUrl = `${this.email.appUrl}/track/${event.publicTrackingToken}`;

      const template = repairApprovalRequestTemplate({
        ...this.email.baseContext(),
        customerName: event.customerName,
        deviceModel: event.deviceModel,
        costEstimate: event.costEstimate,
        trackingUrl,
      });

      await this.email.send({
        event: RepairEvent.APPROVAL_REQUESTED,
        to: event.customerEmail,
        ...template,
        companyId: event.companyId,
      });
    } catch (err) {
      this.logger.error(
        'onApprovalRequested handler failed',
        (err as Error).stack,
      );
    }
  }

  // ─── Completed ───────────────────────────────────────────────────────────────

  @OnEvent(RepairEvent.COMPLETED, { async: true })
  async onCompleted(event: RepairCompletedEvent): Promise<void> {
    if (!event.customerEmail) return;

    try {
      const trackingUrl = `${this.email.appUrl}/track/${event.publicTrackingToken}`;

      const template = repairCompletedTemplate({
        ...this.email.baseContext(),
        customerName: event.customerName,
        deviceModel: event.deviceModel,
        finalPrice: event.finalPrice,
        trackingUrl,
      });

      await this.email.send({
        event: RepairEvent.COMPLETED,
        to: event.customerEmail,
        ...template,
        companyId: event.companyId,
      });
    } catch (err) {
      this.logger.error('onCompleted handler failed', (err as Error).stack);
    }
  }
}
