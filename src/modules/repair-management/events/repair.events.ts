// ─── Event Keys ──────────────────────────────────────────────────────────────

export const RepairEvent = {
  STATUS_CHANGED: 'repair.status_changed',
  APPROVAL_REQUESTED: 'repair.approval_requested',
  COMPLETED: 'repair.completed',
} as const;

export type RepairEventKey = (typeof RepairEvent)[keyof typeof RepairEvent];

// ─── Event Payloads ──────────────────────────────────────────────────────────

export class RepairStatusChangedEvent {
  orderId: string;
  companyId: string;
  customerName: string;
  customerEmail?: string | null;
  deviceModel: string;
  previousStatus: string;
  newStatus: string;
  publicTrackingToken: string;
}

export class RepairApprovalRequestedEvent {
  orderId: string;
  companyId: string;
  customerName: string;
  customerEmail?: string | null;
  deviceModel: string;
  costEstimate?: number | null;
  publicTrackingToken: string;
}

export class RepairCompletedEvent {
  orderId: string;
  companyId: string;
  customerName: string;
  customerEmail?: string | null;
  deviceModel: string;
  finalPrice?: number | null;
  publicTrackingToken: string;
}
