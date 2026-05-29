import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- 1. Ajouter la valeur 'client' à l'enum role (idempotent)
   DO $$ BEGIN
     ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'client';
   EXCEPTION WHEN others THEN null;
   END $$;

   -- 2. Ajouter la colonne effective_distributor_id
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "effective_distributor_id" integer;

   -- 3. FK : effective_distributor_id → users.id
   DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_effective_distributor_id_users_id_fk"
      FOREIGN KEY ("effective_distributor_id") REFERENCES "public"."users"("id")
      ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null;
   END $$;

   -- 4. Index pour la recherche par effectiveDistributor
   CREATE INDEX IF NOT EXISTS "users_effective_distributor_idx"
     ON "users" USING btree ("effective_distributor_id");

   -- 5. Changer le rôle par défaut de 'distributor' à 'client'
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
