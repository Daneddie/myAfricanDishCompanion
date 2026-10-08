// One-time schema for B2 user-state sync. Run: node src/migrate.js
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '')
    ? false
    : { rejectUnauthorized: false },
});

const STATEMENTS = [
  `create table if not exists favorites(
     user_id text not null, dish_id text not null,
     primary key(user_id, dish_id))`,
  `create table if not exists cooked(
     user_id text not null, dish_id text not null,
     cooked_at timestamptz not null default now(),
     primary key(user_id, dish_id))`,
  `create table if not exists shopping(
     user_id text not null, dish_id text not null,
     primary key(user_id, dish_id))`,
  `create table if not exists shopping_checks(
     user_id text not null, item_key text not null,
     primary key(user_id, item_key))`,
  `create table if not exists cook_progress(
     user_id text not null, dish_id text not null, step_index integer not null,
     primary key(user_id, dish_id))`,
  `create table if not exists prefs(
     user_id text primary key, units text not null default 'metric')`,
];

const client = await pool.connect();
try {
  for (const sql of STATEMENTS) await client.query(sql);
  console.log('B2 tables ready.');
} finally {
  client.release();
  await pool.end();
}
