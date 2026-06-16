// Server-only environment access. Throws early if a required secret is missing.
// NEXT_PUBLIC_* vars are read directly where needed so the bundler can inline them.

import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const serverEnv = {
  databaseUrl: () => required("DATABASE_URL"),
  directUrl: () => required("DIRECT_URL"),
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  seventeenTrackApiKey: () => required("SEVENTEENTRACK_API_KEY"),
  seventeenTrackWebhookSecret: () => required("SEVENTEENTRACK_WEBHOOK_SECRET"),
  resendApiKey: () => required("RESEND_API_KEY"),
  emailFrom: () => required("EMAIL_FROM"),
  cronSecret: () => required("CRON_SECRET"),
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
