// Inbound 17Track webhook. Verifies a shared secret, parses the payload and
// runs the sync use case for the matching shipment.
//
// Configure the webhook URL in 17Track as:
//   https://YOUR_DOMAIN/api/webhooks/17track?secret=SEVENTEENTRACK_WEBHOOK_SECRET

import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { serverEnv } from "@/shared/lib/env";
import { trackingProvider } from "@/modules/tracking/infrastructure/seventeen-track.adapter";
import { syncShipment } from "@/modules/tracking/application/sync-shipment";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const provided =
    request.headers.get("x-webhook-secret") ?? url.searchParams.get("secret") ?? "";

  if (provided !== serverEnv.seventeenTrackWebhookSecret()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = trackingProvider.parseWebhook(body);
  if (!parsed) {
    // Acknowledge non-actionable events so 17Track stops retrying.
    return NextResponse.json({ ok: true, handled: false });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: parsed.trackingNumber },
    select: { id: true },
  });
  if (!shipment) {
    return NextResponse.json({ ok: true, handled: false, reason: "unknown tracking" });
  }

  const result = await syncShipment(shipment.id, {
    events: parsed.events,
    rawPayload: parsed.rawPayload,
  });

  return NextResponse.json({ ok: result.ok, advanced: result.advanced });
}
