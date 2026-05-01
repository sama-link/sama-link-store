// Sama Link · initial CustomerList + CustomerListItem schema — ADR-053.
//
// Hand-written migration (instead of `medusa db:generate`) because the
// schema is small and stable. Mirrors the brand-module migration's shape
// so Mikro-ORM introspects cleanly on subsequent generate runs.
//
// Notable indexes:
//   - "IDX_customer_list_owner_type_unique" — enforces one
//     (customer_id, list_type) per non-deleted row, so the lazy
//     get-or-create never produces duplicates.
//   - "IDX_customer_list_item_dedupe_unique" — expression-based unique
//     on (customer_list_id, product_id, COALESCE(variant_id, '')) so
//     Postgres' default NULL ≠ NULL semantics do not allow two wishlist
//     rows for the same product when no variant is pinned.

import { Migration } from "@mikro-orm/migrations"

export class Migration20260501000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "customer_list" (
        "id" TEXT NOT NULL,
        "customer_id" TEXT NOT NULL,
        "list_type" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "customer_list_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customer_list_owner_type_unique"
        ON "customer_list" ("customer_id", "list_type")
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_list_customer_id"
        ON "customer_list" ("customer_id") WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_list_list_type"
        ON "customer_list" ("list_type") WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_list_deleted_at"
        ON "customer_list" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "customer_list_item" (
        "id" TEXT NOT NULL,
        "customer_list_id" TEXT NOT NULL,
        "product_id" TEXT NOT NULL,
        "variant_id" TEXT NULL,
        "title_snapshot" TEXT NULL,
        "thumbnail_snapshot" TEXT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "customer_list_item_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customer_list_item_dedupe_unique"
        ON "customer_list_item" (
          "customer_list_id",
          "product_id",
          (COALESCE("variant_id", ''))
        )
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_list_item_customer_list_id"
        ON "customer_list_item" ("customer_list_id")
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_list_item_product_id"
        ON "customer_list_item" ("product_id") WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_list_item_deleted_at"
        ON "customer_list_item" ("deleted_at")
        WHERE "deleted_at" IS NOT NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "customer_list_item" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "customer_list" CASCADE;`)
  }
}
