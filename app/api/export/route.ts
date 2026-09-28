import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Month-end export for the firm's staff.
// Uses the admin client (bypasses access rules), so it must never be
// reachable without authorisation. Protected by EXPORT_SECRET until the
// app has proper staff accounts; refuses every request if it isn't set.
export async function GET(request: Request) {
  const secret = process.env.EXPORT_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json(
      { error: "clientId is required" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("name, doc_type, status, due_date")
    .eq("client_id", clientId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const rows = [
    "name,type,status,due_date",
    ...(data ?? []).map((d) =>
      [d.name, d.doc_type, d.status, d.due_date].map((v) => `"${v}"`).join(","),
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="export-${clientId}.csv"`,
    },
  });
}
