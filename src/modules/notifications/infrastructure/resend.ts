// Resend client singleton (server only).

import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/shared/lib/env";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    client = new Resend(serverEnv.resendApiKey());
  }
  return client;
}
