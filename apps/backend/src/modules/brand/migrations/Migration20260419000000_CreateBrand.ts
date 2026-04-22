// Sama Link · initial Brand schema — ADR-047.
//
// Hand-written migration (instead of running `medusa db:generate`) because
// the table is simple and the schema is stable. Matches the shape
// `model.define("brand", ...)` produces so Mikro-ORM can introspect cleanly
// on subsequent generate runs.

import { Migration } from "@mikro-orm/migrations"

export class Migration20260419000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "brand" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "handle" TEXT NOT NULL,
        "description" TEXT NULL,
        "image_url" TEXT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_brand_handle_unique"
        ON "brand" ("handle") WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_brand_deleted_at"
        ON "brand" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "brand" CASCADE;`)
  }
}
