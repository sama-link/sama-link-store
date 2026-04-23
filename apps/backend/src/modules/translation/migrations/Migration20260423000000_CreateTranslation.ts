// Sama Link · initial Translation schema.
//
// Hand-written migration (same approach as Brand). Matches the shape
// `model.define("translation", ...)` produces so Mikro-ORM can
// introspect cleanly on subsequent generate runs.

import { Migration } from "@mikro-orm/migrations"

export class Migration20260423000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "translation" (
        "id" TEXT NOT NULL,
        "catalog" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "en" TEXT NULL,
        "ar" TEXT NULL,
        "notes" TEXT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "translation_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_translation_catalog_key_unique"
        ON "translation" ("catalog", "key") WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_translation_catalog"
        ON "translation" ("catalog") WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_translation_deleted_at"
        ON "translation" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "translation" CASCADE;`)
  }
}
