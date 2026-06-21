import { describe, expect, it } from "vitest";

import { isDebtActiveInMonth } from "./calculations";
import { nextReminderTrigger } from "./notifications";

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const DUE_HOUR = 9;
const DUE_MINUTE = 0;

// Build the local-time Date the scheduler anchors a due day to, so expectations
// stay correct regardless of the machine's timezone.
function dueAt(year: number, month: number, day: number): Date {
  return new Date(year, month, day, DUE_HOUR, DUE_MINUTE, 0, 0);
}

describe("nextReminderTrigger", () => {
  describe("month-end day clamping", () => {
    it("clamps day 31 to Feb 28 in a non-leap year", () => {
      const now = new Date(2025, 1, 1, 8, 0, 0, 0); // Feb 1, 2025
      const trigger = nextReminderTrigger(31, DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      // Feb 2025 has 28 days, so due day clamps to the 28th; lead is 24h.
      expect(trigger).toEqual(new Date(dueAt(2025, 1, 28).getTime() - DAY_MS));
    });

    it("clamps day 31 to Feb 29 in a leap year", () => {
      const now = new Date(2024, 1, 1, 8, 0, 0, 0); // Feb 1, 2024 (leap)
      const trigger = nextReminderTrigger(31, DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      expect(trigger).toEqual(new Date(dueAt(2024, 1, 29).getTime() - DAY_MS));
    });

    it("clamps day 31 to 30 for a 30-day month", () => {
      const now = new Date(2025, 3, 1, 8, 0, 0, 0); // Apr 1, 2025 (30 days)
      const trigger = nextReminderTrigger(31, DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      expect(trigger).toEqual(new Date(dueAt(2025, 3, 30).getTime() - DAY_MS));
    });
  });

  describe("debt term-end exclusion", () => {
    it("returns null when the debt's active term is entirely in the past", () => {
      const now = new Date(2025, 5, 1, 8, 0, 0, 0); // Jun 1, 2025
      // Term: Jan 2020 for 12 months -> ends before 2021. Never active now.
      const trigger = nextReminderTrigger(15, DAY_MS, now, DUE_HOUR, DUE_MINUTE, (m, y) =>
        isDebtActiveInMonth(0, 2020, 12, m, y),
      );
      expect(trigger).toBeNull();
    });

    it("skips months past the term end and stops once inactive", () => {
      const now = new Date(2025, 5, 1, 8, 0, 0, 0); // Jun 1, 2025
      // Term ends after Jun 2025 (active months: ... up to and including Jun).
      // Started Jun 2025 for 1 month -> only Jun 2025 is active.
      const trigger = nextReminderTrigger(15, DAY_MS, now, DUE_HOUR, DUE_MINUTE, (m, y) =>
        isDebtActiveInMonth(5, 2025, 1, m, y),
      );
      // Jun 15 is still upcoming, so it should schedule for that single month.
      expect(trigger).toEqual(new Date(dueAt(2025, 5, 15).getTime() - DAY_MS));
    });

    it("returns null when the only active month's due date has already passed", () => {
      const now = new Date(2025, 5, 20, 8, 0, 0, 0); // Jun 20, 2025
      // Active only in Jun 2025, but the 15th already passed -> nothing left.
      const trigger = nextReminderTrigger(15, DAY_MS, now, DUE_HOUR, DUE_MINUTE, (m, y) =>
        isDebtActiveInMonth(5, 2025, 1, m, y),
      );
      expect(trigger).toBeNull();
    });
  });

  describe("past-due-this-month rolls to next month", () => {
    it("rolls to next month when this month's due day already passed", () => {
      const now = new Date(2025, 2, 20, 8, 0, 0, 0); // Mar 20, 2025
      const trigger = nextReminderTrigger(5, DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      // Mar 5 already passed, so the next occurrence is Apr 5.
      expect(trigger).toEqual(new Date(dueAt(2025, 3, 5).getTime() - DAY_MS));
    });

    it("treats a due day whose lead window already elapsed today as passed", () => {
      // Due is today at 09:00, lead is 24h, so the trigger (yesterday 09:00) is
      // in the past -> roll to next month.
      const now = new Date(2025, 2, 15, 12, 0, 0, 0); // Mar 15, 2025, 12:00
      const trigger = nextReminderTrigger(15, DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      expect(trigger).toEqual(new Date(dueAt(2025, 3, 15).getTime() - DAY_MS));
    });

    it("rolls across a year boundary from December to January", () => {
      const now = new Date(2025, 11, 20, 8, 0, 0, 0); // Dec 20, 2025
      const trigger = nextReminderTrigger(5, DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      expect(trigger).toEqual(new Date(dueAt(2026, 0, 5).getTime() - DAY_MS));
    });
  });

  describe("24h vs 48h lead-time offset", () => {
    it("fires 24h before the due date with a 24h lead", () => {
      const now = new Date(2025, 5, 1, 8, 0, 0, 0); // Jun 1, 2025
      const trigger = nextReminderTrigger(15, DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      expect(trigger).toEqual(new Date(dueAt(2025, 5, 15).getTime() - DAY_MS));
    });

    it("fires 48h before the due date with a 48h lead", () => {
      const now = new Date(2025, 5, 1, 8, 0, 0, 0); // Jun 1, 2025
      const trigger = nextReminderTrigger(15, 2 * DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      expect(trigger).toEqual(
        new Date(dueAt(2025, 5, 15).getTime() - 2 * DAY_MS),
      );
    });

    it("the 48h trigger is exactly 24h earlier than the 24h trigger", () => {
      const now = new Date(2025, 5, 1, 8, 0, 0, 0); // Jun 1, 2025
      const lead24 = nextReminderTrigger(15, DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      const lead48 = nextReminderTrigger(15, 2 * DAY_MS, now, DUE_HOUR, DUE_MINUTE);
      expect(lead24).not.toBeNull();
      expect(lead48).not.toBeNull();
      expect(lead24!.getTime() - lead48!.getTime()).toBe(DAY_MS);
    });
  });
});
