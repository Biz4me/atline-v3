import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // NOTE: 'client' enum value was added in migration 20260529_215900
  // and committed there. We can safely use it here in a new transaction.
  await db.execute(sql`
   -- 1. Ajouter la colonne effective_distributor_id
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "effective_distributor_id" integer;

   -- 2. FK : effective_distributor_id → users.id
   DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_effective_distributor_id_users_id_fk"
      FOREIGN KEY ("effective_distributor_id") REFERENCES "public"."users"("id")
      ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null;
   END $$;

   -- 3. Index pour la recherche par effectiveDistributor
   CREATE INDEX IF NOT EXISTS "users_effective_distributor_idx"
     ON "users" USING btree ("effective_distributor_id");

   -- 4. Changer le rôle par défaut de 'distributor' à 'client'
   ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'client';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'distributor';
   DROP INDEX IF EXISTS "users_effective_distributor_idx";
   ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_effective_distributor_id_users_id_fk";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "effective_distributor_id";
  `)
}
