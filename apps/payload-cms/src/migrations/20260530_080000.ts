import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invite_token" varchar;
   CREATE UNIQUE INDEX IF NOT EXISTS "users_invite_token_idx" ON "users" USING btree ("invite_token");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "users_invite_token_idx";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "invite_token";
  `)
}
