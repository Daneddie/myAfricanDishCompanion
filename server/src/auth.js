import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { betterAuth } from 'better-auth';

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment.');
  process.exit(1);
}

const dialect = new PostgresDialect({
  pool: new Pool({ connectionString: process.env.DATABASE_URL }),
});

export const db = new Kysely({ dialect });

// Dev email stub: logs instead of sending (no domain yet).
// Swap with ZeptoMail API/SMTP when the sending domain arrives (B1 email step).
function devSendEmail(type, to, url) {
  console.log(`[email:${type}] to=${to} link=${url}`);
}

export const auth = betterAuth({
  database: { db, type: 'postgres' },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      devSendEmail('reset-password', user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      devSendEmail('verify-email', user.email, url);
    },
  },
  trustedOrigins: (process.env.TRUSTED_ORIGINS || '').split(',').filter(Boolean),
});
