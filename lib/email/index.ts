// Sends email through Resend's HTTP API.
// Needs RESEND_API_KEY and EMAIL_FROM. In development, if they're not set,
// the email is logged instead of sent, so reminders can be tested locally.
// In production, missing settings are an error rather than a silent skip.

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `\n[Email not sent: no provider configured]\nTo: ${to}\nSubject: ${subject}\n\n${body}\n`,
      );
      return;
    }
    throw new Error(
      "Email provider not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text: body }),
  });

  if (!response.ok) {
    throw new Error(
      `Email to ${to} failed: ${response.status} ${await response.text()}`,
    );
  }
}
