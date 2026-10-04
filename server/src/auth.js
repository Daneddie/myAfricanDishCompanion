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

export const auth = betterAuth({
  database: { db, type: 'postgres' },
  emailAndPassword: { enabled: true },
  trustedOrigins: (process.env.TRUSTED_ORIGINS || '').split(',').filter(Boolean),
});
