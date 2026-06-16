// Scheduled tracking sync. Processes shipments whose nextSyncAt is due.
// Protected by CRON_SECRET. On Vercel, Cron Jobs automatically send
// `Authorization: Bearer <CRON_SECRET>` when the env var is set.

import { NextResponse } from "next/server";
import { serverEnv } from "@/shared/lib/env";
import { syncDueShipments } from "@/modules/tracking/application/sync-shipment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const secret = serverEnv.cronSecret();

  const authorized = auth === `Bearer ${secret}` || querySecret === secret;
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await syncDueShipments();
  return NextResponse.json({ ok: true, ...summary });
}
