import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema-pg.ts',
  out: './src/db/migrations-pg',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://curriculum:curriculum@127.0.0.1:5433/curriculum',
  },
});
