// Rules for overdue-document reminders.
// A document is due a reminder when it is outstanding, more than
// OVERDUE_AFTER_DAYS past its due date, and hasn't been included in a
// reminder within the last REMIND_EVERY_DAYS.

export const OVERDUE_AFTER_DAYS = 7;
export const REMIND_EVERY_DAYS = 7;

export type ReminderCandidate = {
  id: string;
  name: string;
  status: string;
  due_date: string; // YYYY-MM-DD
  last_reminded_at: string | null; // ISO timestamp
};

// Dates are compared as YYYY-MM-DD strings, which sort correctly.
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isDueForReminder(
  doc: ReminderCandidate,
  today: string,
): boolean {
  if (doc.status !== "outstanding") return false;

  // "More than a week overdue": due before today minus 7 days.
  const overdueCutoff = addDays(today, -OVERDUE_AFTER_DAYS);
  if (doc.due_date >= overdueCutoff) return false;

  if (!doc.last_reminded_at) return true;
  const lastReminded = doc.last_reminded_at.slice(0, 10);
  return lastReminded <= addDays(today, -REMIND_EVERY_DAYS);
}
