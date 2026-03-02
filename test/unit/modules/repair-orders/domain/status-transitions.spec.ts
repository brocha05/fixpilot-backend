/**
 * Status Transitions — Unit Tests
 *
 * Tests the strict FSM rules for repair order status transitions.
 * No database or external services required.
 */

import { RepairStatus } from '@prisma/client';
import {
  isTransitionAllowed,
  isTerminal,
  ALLOWED_TRANSITIONS,
  TERMINAL_STATUSES,
} from 'src/modules/repair-orders/domain/status-transitions';

const ALL_STATUSES = Object.values(RepairStatus);

describe('Status Transition Rules', () => {
  // ─── Forward-path happy paths ──────────────────────────────────────────────

  describe('allowed transitions', () => {
    const validPaths: [RepairStatus, RepairStatus][] = [
      [RepairStatus.PENDING, RepairStatus.DIAGNOSED],
      [RepairStatus.PENDING, RepairStatus.CANCELLED],
      [RepairStatus.DIAGNOSED, RepairStatus.WAITING_APPROVAL],
      [RepairStatus.DIAGNOSED, RepairStatus.APPROVED],
      [RepairStatus.DIAGNOSED, RepairStatus.CANCELLED],
      [RepairStatus.WAITING_APPROVAL, RepairStatus.APPROVED],
      [RepairStatus.WAITING_APPROVAL, RepairStatus.CANCELLED],
      [RepairStatus.APPROVED, RepairStatus.IN_PROGRESS],
      [RepairStatus.APPROVED, RepairStatus.CANCELLED],
      [RepairStatus.IN_PROGRESS, RepairStatus.WAITING_PARTS],
      [RepairStatus.IN_PROGRESS, RepairStatus.COMPLETED],
      [RepairStatus.IN_PROGRESS, RepairStatus.CANCELLED],
      [RepairStatus.WAITING_PARTS, RepairStatus.IN_PROGRESS],
      [RepairStatus.WAITING_PARTS, RepairStatus.CANCELLED],
      [RepairStatus.COMPLETED, RepairStatus.DELIVERED],
    ];

    test.each(validPaths)('allows transition from %s → %s', (from, to) => {
      expect(isTransitionAllowed(from, to)).toBe(true);
    });
  });

  // ─── Invalid transitions ───────────────────────────────────────────────────

  describe('forbidden transitions', () => {
    const invalidPaths: [RepairStatus, RepairStatus][] = [
      [RepairStatus.PENDING, RepairStatus.COMPLETED],
      [RepairStatus.PENDING, RepairStatus.IN_PROGRESS],
      [RepairStatus.PENDING, RepairStatus.DELIVERED],
      [RepairStatus.DIAGNOSED, RepairStatus.DELIVERED],
      [RepairStatus.COMPLETED, RepairStatus.CANCELLED], // COMPLETED is nearly terminal
      [RepairStatus.DELIVERED, RepairStatus.PENDING], // DELIVERED is terminal
      [RepairStatus.DELIVERED, RepairStatus.CANCELLED], // DELIVERED is terminal
      [RepairStatus.CANCELLED, RepairStatus.PENDING], // CANCELLED is terminal
      [RepairStatus.CANCELLED, RepairStatus.IN_PROGRESS],
    ];

    test.each(invalidPaths)('blocks transition from %s → %s', (from, to) => {
      expect(isTransitionAllowed(from, to)).toBe(false);
    });
  });

  // ─── Self-transitions are always forbidden ─────────────────────────────────

  describe('self-transitions', () => {
    test.each(ALL_STATUSES)('blocks self-transition on %s', (status) => {
      expect(isTransitionAllowed(status, status)).toBe(false);
    });
  });

  // ─── Terminal states ───────────────────────────────────────────────────────

  describe('terminal states', () => {
    it('marks DELIVERED as terminal', () => {
      expect(isTerminal(RepairStatus.DELIVERED)).toBe(true);
    });

    it('marks CANCELLED as terminal', () => {
      expect(isTerminal(RepairStatus.CANCELLED)).toBe(true);
    });

    const nonTerminal = ALL_STATUSES.filter(
      (s) => !TERMINAL_STATUSES.includes(s),
    );
    test.each(nonTerminal)('%s is not terminal', (status) => {
      expect(isTerminal(status)).toBe(false);
    });

    it('terminal states have no outgoing transitions', () => {
      for (const terminal of TERMINAL_STATUSES) {
        expect(ALLOWED_TRANSITIONS[terminal]).toHaveLength(0);
      }
    });
  });

  // ─── Completeness ─────────────────────────────────────────────────────────

  it('covers every RepairStatus in the transition map', () => {
    for (const status of ALL_STATUSES) {
      expect(ALLOWED_TRANSITIONS).toHaveProperty(status);
    }
  });
});
