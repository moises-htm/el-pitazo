#!/usr/bin/env node
/**
 * Run before deploying to verify all required env vars are set.
 * Usage: node scripts/check-env.mjs
 *
 * In CI/Vercel: this runs automatically via the build if you add it to the build command.
 * Locally: copy .env.example → .env.local and fill in values, then run this script.
 */

import { config } from "process";

const REQUIRED = [
  "DATABASE_URL",
  "JWT_SECRET",
  "MP_SECRET_KEY",
  "MP_PUBLIC_KEY",
  "MP_WEBHOOK_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "NEXT_PUBLIC_BASE_URL",
];

const OPTIONAL = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_GOOGLE_MAPS_KEY",
];

let ok = true;

console.log("\n🔍 El Pitazo — Environment Variable Check\n");

console.log("Required:");
for (const name of REQUIRED) {
  const set = !!process.env[name];
  console.log(`  ${set ? "✅" : "❌"} ${name}`);
  if (!set) ok = false;
}

console.log("\nOptional:");
for (const name of OPTIONAL) {
  const set = !!process.env[name];
  console.log(`  ${set ? "✅" : "⚠️ "} ${name}`);
}

console.log("");

if (!ok) {
  console.error("❌ Missing required vars — fix before deploying.\n");
  process.exit(1);
} else {
  console.log("✅ All required vars are set.\n");
}
