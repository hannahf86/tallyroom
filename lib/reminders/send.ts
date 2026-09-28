import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { isDueForReminder, type ReminderCandidate } from "./overdue";

type DocumentRow = ReminderCandidate & {
  client_id: string;
  clients: { name: string; user_id: string } | null;
};

export type ReminderResult = {
  sent: number;
  skippedNoEmail: string[];
  failed: string[];
};

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildEmail(clientName: string, docs: DocumentRow[]) {
  const list = docs
    .map((d) => `- ${d.name}, due ${formatDate(d.due_date)}`)
    .join("\n");
  const portal = process.env.APP_URL
    ? `\nYou can upload them here: ${process.env.APP_URL}\n`
    : "";

  return {
    subject: "Reminder: documents we're still waiting for",
    body: `Hello,

We're still waiting for the following from ${clientName}:

${list}
${portal}
If you've already sent these, or need a little more time, just reply and let us know.

Thank you`,
  };
}

// Server-only: uses the admin client, which bypasses access rules,
// because the job needs to see every client's documents.
export async function sendOverdueReminders(
  today = new Date().toISOString().slice(0, 10),
): Promise<ReminderResult> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("documents")
    .select(
      "id, name, status, due_date, last_reminded_at, client_id, clients(name, user_id)",
    )
    .eq("status", "outstanding");
  if (error) throw error;

  const due = (data as unknown as DocumentRow[]).filter((doc) =>
    isDueForReminder(doc, today),
  );

  // One email per client, listing everything overdue.
  const byClient = new Map<string, DocumentRow[]>();
  for (const doc of due) {
    byClient.set(doc.client_id, [...(byClient.get(doc.client_id) ?? []), doc]);
  }

  const result: ReminderResult = { sent: 0, skippedNoEmail: [], failed: [] };

  for (const docs of byClient.values()) {
    const client = docs[0].clients;
    if (!client) continue;

    const { data: userData } = await admin.auth.admin.getUserById(
      client.user_id,
    );
    const email = userData.user?.email;
    if (!email) {
      result.skippedNoEmail.push(client.name);
      continue;
    }

    const { subject, body } = buildEmail(client.name, docs);
    try {
      await sendEmail(email, subject, body);
    } catch (err) {
      // Not marked as reminded, so it's retried on the next run.
      console.error(`Reminder to ${client.name} failed:`, err);
      result.failed.push(client.name);
      continue;
    }

    const { error: updateError } = await admin
      .from("documents")
      .update({ last_reminded_at: new Date().toISOString() })
      .in(
        "id",
        docs.map((d) => d.id),
      );
    if (updateError)
      console.error(
        `Couldn't record reminder for ${client.name}:`,
        updateError,
      );

    result.sent++;
  }

  return result;
}
