import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// PostgreSQL constraint: a new enum value can only be USED
// in a subsequent transaction after it has been committed.
// This migration adds the 'client' value, the next one uses it.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'client';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL does not support removing enum values
  // The 'client' value will remain but be unused if roles are reverted
}
