// Database seed.
//
//   - AppConfig: tracking sync frequencies per zone (hours).
//   - Branch / Destination: the initial "Rosario" rows (multi-branch ready).
//   - Admins: the two initial administrators, created in Supabase Auth and
//     mirrored into the User table. Skipped if Supabase is not yet configured.
//
// Run with: npm run db:seed

import { existsSync } from "node:fs";
import { PrismaClient, UserRole } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const prisma = new PrismaClient();

const PLACEHOLDER = "PLACEHOLDER";

function isConfigured(...values: (string | undefined)[]): boolean {
  return values.every((v) => !!v && v !== PLACEHOLDER && !v.includes("PLACEHOLDER"));
}

async function seedConfig() {
  await prisma.appConfig.upsert({
    where: { key: "sync_frequencies_hours" },
    update: {},
    create: {
      key: "sync_frequencies_hours",
      // Hours between automatic syncs per zone. Tunable at runtime.
      value: { CHINA: 12, ARGENTINA: 6, NEAR_DELIVERY: 2 },
    },
  });
  console.log("✓ AppConfig: sync_frequencies_hours");
}

async function seedBranchAndDestination() {
  const existingBranch = await prisma.branch.findFirst({ where: { city: "Rosario" } });
  if (!existingBranch) {
    await prisma.branch.create({ data: { name: "Rosario", city: "Rosario" } });
    console.log("✓ Branch: Rosario");
  }

  const existingDest = await prisma.destination.findFirst({ where: { city: "Rosario" } });
  if (!existingDest) {
    await prisma.destination.create({ data: { city: "Rosario", province: "Santa Fe" } });
    console.log("✓ Destination: Rosario");
  }
}

async function ensureAdmin(
  supabase: SupabaseClient,
  email: string,
  password: string,
) {
  // Create the auth user (idempotent: reuse if it already exists).
  let userId: string | undefined;

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // app_metadata is server-controlled — used for role-based route gating.
    app_metadata: { role: "ADMIN" },
  });

  if (created?.user) {
    userId = created.user.id;
  } else if (error) {
    // Likely already exists — look it up.
    const { data: list } = await supabase.auth.admin.listUsers();
    userId = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  }

  if (!userId) {
    console.warn(`! Could not create or find admin auth user: ${email} (${error?.message})`);
    return;
  }

  await prisma.user.upsert({
    where: { id: userId },
    update: { role: UserRole.ADMIN, email, isActive: true },
    create: { id: userId, email, role: UserRole.ADMIN },
  });
  console.log(`✓ Admin: ${email}`);
}

async function seedAdmins() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isConfigured(supabaseUrl, serviceKey)) {
    console.warn(
      "! Skipping admin bootstrap: Supabase is not configured yet. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then re-run `npm run db:seed`.",
    );
    return;
  }

  const supabase = createClient(supabaseUrl!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const admins = [
    { email: process.env.ADMIN_1_EMAIL, password: process.env.ADMIN_1_PASSWORD },
    { email: process.env.ADMIN_2_EMAIL, password: process.env.ADMIN_2_PASSWORD },
  ];

  for (const admin of admins) {
    if (!isConfigured(admin.email, admin.password)) {
      console.warn("! Skipping an admin: ADMIN_*_EMAIL / ADMIN_*_PASSWORD not set.");
      continue;
    }
    await ensureAdmin(supabase, admin.email!, admin.password!);
  }
}

async function main() {
  console.log("Seeding database...");
  await seedConfig();
  await seedBranchAndDestination();
  await seedAdmins();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
