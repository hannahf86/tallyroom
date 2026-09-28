import { describe, it, expect } from "vitest";
import {
  isDueForReminder,
  type ReminderCandidate,
} from "../lib/reminders/overdue";

const today = "2026-09-28";

const doc = (
  overrides: Partial<ReminderCandidate> = {},
): ReminderCandidate => ({
  id: "1",
  name: "Test document",
  status: "outstanding",
  due_date: "2026-09-18",
  last_reminded_at: null,
  ...overrides,
});

describe("isDueForReminder", () => {
  it("reminds about a document 10 days overdue", () => {
    expect(isDueForReminder(doc({ due_date: "2026-09-18" }), today)).toBe(true);
  });

  it("reminds about a document 8 days overdue", () => {
    expect(isDueForReminder(doc({ due_date: "2026-09-20" }), today)).toBe(true);
  });

  it("does not remind at exactly 7 days overdue", () => {
    expect(isDueForReminder(doc({ due_date: "2026-09-21" }), today)).toBe(
      false,
    );
  });

  it("does not remind about a document that isn't due yet", () => {
    expect(isDueForReminder(doc({ due_date: "2026-10-03" }), today)).toBe(
      false,
    );
  });

  it("does not remind about received documents, however overdue", () => {
    expect(
      isDueForReminder(
        doc({ status: "received", due_date: "2026-09-01" }),
        today,
      ),
    ).toBe(false);
  });

  it("does not remind again within a week", () => {
    expect(
      isDueForReminder(
        doc({ last_reminded_at: "2026-09-25T08:00:00Z" }),
        today,
      ),
    ).toBe(false);
  });

  it("reminds again once a week has passed", () => {
    expect(
      isDueForReminder(
        doc({ last_reminded_at: "2026-09-21T08:00:00Z" }),
        today,
      ),
    ).toBe(true);
  });
});
