/**
 * Validates required environment variables at server startup.
 * Import this in any API route that depends on critical config,
 * or call it once from next.config.js.
 *
 * In production a missing required var throws immediately so the
 * deploy fails fast rather than silently mis-behaving.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  { name: "DATABASE_URL",           required: true,  description: "Neon PostgreSQL connection string" },
  { name: "JWT_SECRET",             required: true,  description: "JWT signing secret (min 32 chars)" },
  { name: "MP_SECRET_KEY",          required: true,  description: "MercadoPago secret access token" },
  { name: "MP_PUBLIC_KEY",          required: true,  description: "MercadoPago public key" },
  { name: "MP_WEBHOOK_SECRET",      required: true,  description: "MercadoPago webhook signature secret" },
  { name: "BLOB_READ_WRITE_TOKEN",  required: true,  description: "Vercel Blob storage token" },
  { name: "NEXT_PUBLIC_BASE_URL",   required: true,  description: "App base URL, e.g. https://elpitazo.app" },
  { name: "NEXT_PUBLIC_SENTRY_DSN", required: false, description: "Sentry DSN for error tracking" },
  { name: "VAPID_PUBLIC_KEY",       required: false, description: "Web push VAPID public key" },
  { name: "VAPID_PRIVATE_KEY",      required: false, description: "Web push VAPID private key" },
  { name: "CRON_SECRET",            required: false, description: "Secret for cron endpoint protection" },
  { name: "NEXTAUTH_SECRET",        required: false, description: "NextAuth signing secret" },
];

let checked = false;

export function checkEnv(): void {
  if (checked || process.env.NODE_ENV !== "production") return;
  checked = true;

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of ENV_VARS) {
    if (!process.env[v.name]) {
      if (v.required) {
        missing.push(`  ❌ ${v.name} — ${v.description}`);
      } else {
        warnings.push(`  ⚠️  ${v.name} — ${v.description}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn("[env-check] Optional vars not set (features may be degraded):\n" + warnings.join("\n"));
  }

  if (missing.length > 0) {
    throw new Error(
      `[env-check] MISSING REQUIRED ENVIRONMENT VARIABLES — app cannot start safely:\n` +
      missing.join("\n") +
      `\n\nSet these in Vercel → Project → Settings → Environment Variables.`
    );
  }
}
