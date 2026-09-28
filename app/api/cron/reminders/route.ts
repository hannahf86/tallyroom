import { NextResponse } from "next/server";
import { sendOverdueReminders } from "@/lib/reminders/send";

// Called once a day by the scheduler. Protected by CRON_SECRET:
// if the secret isn't set, the endpoint refuses every request.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const result = await sendOverdueReminders();
  return NextResponse.json(result);
}
