// Demo seed — creates sample data so you can SEE the app working immediately,
// without needing 17Track or Resend configured.
//
//   - A demo client you can log in as (email + known password).
//   - Several demo orders at DIFFERENT stages so you can see both maps:
//       · "Despachado desde China"  -> 3D globe (international leg)
//       · "En proceso aduanero"     -> animated national map
//
// Idempotent: re-running only adds the stages that are missing.
// Run AFTER `npm run db:seed`, with: npm run db:seed:demo

import { existsSync } from "node:fs";
import { PrismaClient, type OrderStatus, type Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env")) process.loadEnvFile(".env");

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@cliente.com";
const DEMO_PASSWORD = "Demo1234";

const day = 24 * 60 * 60 * 1000;
const now = Date.now();
const at = (daysAgo: number) => new Date(now - daysAgo * day);

function isConfigured(...v: (string | undefined)[]) {
  return v.every((x) => !!x && !x.includes("PLACEHOLDER"));
}

interface DemoOrderSpec {
  status: OrderStatus;
  trackingNumber: string;
  history: { status: OrderStatus; daysAgo: number; auto?: boolean }[];
  syncZone: "CHINA" | "ARGENTINA" | "NEAR_DELIVERY";
}

const DEMO_ORDERS: DemoOrderSpec[] = [
  {
    status: "DISPATCHED_CHINA",
    trackingNumber: "LP00432211988CN",
    syncZone: "CHINA",
    history: [
      { status: "CONFIRMED", daysAgo: 8 },
      { status: "DISPATCHED_CHINA", daysAgo: 5, auto: true },
    ],
  },
  {
    status: "CUSTOMS_PROCESSING",
    trackingNumber: "AR556677889YT",
    syncZone: "ARGENTINA",
    history: [
      { status: "CONFIRMED", daysAgo: 20 },
      { status: "DISPATCHED_CHINA", daysAgo: 14, auto: true },
      { status: "ARRIVED_ARGENTINA", daysAgo: 4, auto: true },
      { status: "CUSTOMS_PROCESSING", daysAgo: 2, auto: true },
    ],
  },
];

async function createDemoOrder(
  tx: Prisma.TransactionClient,
  clientId: string,
  adminId: string,
  spec: DemoOrderSpec,
) {
  const last = await tx.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const order = await tx.order.create({
    data: {
      orderNumber: (last?.orderNumber ?? 0) + 1,
      clientId,
      currentStatus: spec.status,
      totalAmount: 180000,
      depositAmount: 90000,
      balanceAmount: 90000,
      paymentStatus: "DEPOSIT_RECEIVED",
      confirmedAt: at(spec.history[0].daysAgo),
      estimatedDeliveryFrom: new Date(now + 15 * day),
      estimatedDeliveryTo: new Date(now + 25 * day),
      items: {
        create: [
          {
            productName: "Camiseta Argentina Titular 2024",
            size: "L",
            version: "Jugador",
            printName: "MESSI",
            printNumber: "10",
            patches: "Campeón del Mundo",
            unitPrice: 95000,
            quantity: 1,
            ownerName: "Cliente Demo",
          },
          {
            productName: "Camiseta Boca Juniors 2024",
            size: "M",
            version: "Hincha",
            unitPrice: 85000,
            quantity: 1,
            ownerName: "Hermano del cliente",
            ownerContact: "+54 9 341 111 1111",
          },
        ],
      },
      payments: {
        create: {
          type: "DEPOSIT",
          amount: 90000,
          method: "TRANSFER",
          recordedByUserId: adminId,
          paidAt: at(spec.history[0].daysAgo),
        },
      },
      statusHistory: {
        create: spec.history.map((h) => ({
          status: h.status,
          source: h.auto ? "AUTO_TRANSLATED" : "MANUAL",
          enteredAt: at(h.daysAgo),
          changedByUserId: h.auto ? null : adminId,
        })),
      },
      shipment: {
        create: {
          trackingNumber: spec.trackingNumber,
          provider: "17TRACK",
          registeredWithProvider: false,
          syncZone: spec.syncZone,
          lastSyncedAt: at(2),
        },
      },
    },
  });
  console.log(`✓ Pedido demo #${order.orderNumber} (${spec.status}) creado`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isConfigured(url, key)) {
    console.error("Supabase no está configurado. Completá el .env y reintentá.");
    process.exit(1);
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.error("No hay administradores. Corré primero: npm run db:seed");
    process.exit(1);
  }

  // Ensure the demo auth user + mirror rows.
  const supabase = createClient(url!, key!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let client = await prisma.client.findUnique({ where: { email: DEMO_EMAIL } });
  if (!client) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      app_metadata: { role: "CLIENT" },
    });
    let userId = created?.user?.id;
    if (!userId) {
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list?.users.find((u) => u.email === DEMO_EMAIL)?.id;
    }
    if (!userId) {
      console.error("No se pudo crear el usuario demo:", error?.message);
      process.exit(1);
    }
    await prisma.user.upsert({
      where: { id: userId },
      update: { role: "CLIENT", email: DEMO_EMAIL },
      create: { id: userId, email: DEMO_EMAIL, role: "CLIENT" },
    });
    client = await prisma.client.create({
      data: {
        userId,
        fullName: "Cliente Demo",
        email: DEMO_EMAIL,
        instagram: "@clientedemo",
        whatsapp: "+54 9 341 000 0000",
      },
    });
  }

  // Create the demo stages (idempotent by tracking number — robust to status edits).
  const existing = await prisma.shipment.findMany({ select: { trackingNumber: true } });
  const haveTracking = new Set(existing.map((s) => s.trackingNumber));

  for (const spec of DEMO_ORDERS) {
    if (haveTracking.has(spec.trackingNumber)) {
      console.log(`• Ya existe un pedido con tracking ${spec.trackingNumber}, lo salto.`);
      continue;
    }
    await prisma.$transaction((tx) => createDemoOrder(tx, client!.id, admin.id, spec));
  }

  console.log("\nListo. Entrá al portal con:");
  console.log(`   email:    ${DEMO_EMAIL}`);
  console.log(`   password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
