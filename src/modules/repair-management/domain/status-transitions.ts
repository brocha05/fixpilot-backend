import { RepairStatus } from '@prisma/client';

// ─── Allowed Transitions ─────────────────────────────────────────────────────
//
// Terminal states: DELIVERED, CANCELLED (no further transitions)
// COMPLETED → DELIVERED (final hand-off, no cancellation possible)

export const ALLOWED_TRANSITIONS: Readonly<Record<RepairStatus, RepairStatus[]>> = {
  [RepairStatus.PENDING]: [RepairStatus.DIAGNOSED, RepairStatus.CANCELLED],
  [RepairStatus.DIAGNOSED]: [
    RepairStatus.WAITING_APPROVAL,
    RepairStatus.APPROVED,
    RepairStatus.CANCELLED,
  ],
  [RepairStatus.WAITING_APPROVAL]: [RepairStatus.APPROVED, RepairStatus.CANCELLED],
  [RepairStatus.APPROVED]: [RepairStatus.IN_PROGRESS, RepairStatus.CANCELLED],
  [RepairStatus.IN_PROGRESS]: [
    RepairStatus.WAITING_PARTS,
    RepairStatus.COMPLETED,
    RepairStatus.CANCELLED,
  ],
  [RepairStatus.WAITING_PARTS]: [RepairStatus.IN_PROGRESS, RepairStatus.CANCELLED],
  [RepairStatus.COMPLETED]: [RepairStatus.DELIVERED],
  [RepairStatus.DELIVERED]: [],
  [RepairStatus.CANCELLED]: [],
};

export function isTransitionAllowed(from: RepairStatus, to: RepairStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export const TERMINAL_STATUSES: RepairStatus[] = [
  RepairStatus.DELIVERED,
  RepairStatus.CANCELLED,
];

export function isTerminal(status: RepairStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// Spanish labels for client-facing messages
export const REPAIR_STATUS_LABELS_ES: Record<RepairStatus, string> = {
  [RepairStatus.PENDING]: 'Pendiente',
  [RepairStatus.DIAGNOSED]: 'Diagnosticado',
  [RepairStatus.WAITING_APPROVAL]: 'En espera de aprobación',
  [RepairStatus.APPROVED]: 'Aprobado',
  [RepairStatus.IN_PROGRESS]: 'En reparación',
  [RepairStatus.WAITING_PARTS]: 'En espera de refacciones',
  [RepairStatus.COMPLETED]: 'Reparación completada',
  [RepairStatus.DELIVERED]: 'Entregado',
  [RepairStatus.CANCELLED]: 'Cancelado',
};

export const URGENCY_LABELS_ES: Record<string, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};
