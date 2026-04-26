# Local development seed baseline

After a fresh clone the local Postgres has no admin user, no products,
no Egypt region, and no publishable API key — the storefront cannot
connect and `/app` cannot be logged into. This doc describes the
single command that makes the local dev stack usable, what it creates,
and how to keep the baseline reproducible.

## TL;DR — fresh-clone flow

```bash
git clone https://github.com/sama-link/sama-link-store.git
cd sama-link-store
npm install                                                       # workspace install (root)
cp .env.example apps/backend/.env                                 # MEDUSA_ADMIN_EMAIL/PASSWORD live here
docker compose -f docker-compose.dev.yml up -d postgres backend   # postgres + medusa
docker compose -f docker-compose.dev.yml exec backend \
  sh -c "cd /app/apps/backend && npm run seed:local"              # admin + catalog + region + key

# Copy the printed NEXT_PUBLIC_* lines into apps/storefront/.env.local
cp apps/storefront/.env.local.example apps/storefront/.env.local
# (paste the seed output's two reg_… and pk_… values)

npm run dev:storefront                                            # http://localhost:3000
```

## What `npm run seed:local` does

Two steps, in order, both idempotent:

1. **Admin user** — `medusa user -e $MEDUSA_ADMIN_EMAIL -p $MEDUSA_ADMIN_PASSWORD`.
   This is Medusa's official CLI command. It wires the auth identity
   correctly (provider `emailpass`, password hash, app metadata link).
   We do NOT create users from inside `seed.ts` — bypassing the auth
   identity layer produces broken logins. On re-runs the command errors
   with "user already exists"; the npm script's `|| true` swallows that
   so the seed step still runs.

2. **Catalog + region + publishable key** — `medusa exec ./src/scripts/seed.ts`.
   Check-before-create for every entity, so re-runs are no-ops:
   - Egypt region (`currency_code=egp`, `countries=[eg]`)
   - `networking` category
   - 3 deterministic products (gigabit switch, AC1200 router, Cat6 cable)
     with stable handles + SKUs
   - One EGP price set per variant at 150 EGP (15000 minor units)
   - Placeholder thumbnails (only set when missing)
   - Publishable API key titled `Storefront Default`, linked to the
     default sales channel that Medusa auto-creates on first boot

The seed ends with a `Local development summary` block that prints the
admin URL, admin email, region ID, publishable token, and the exact
five `NEXT_PUBLIC_*` lines to paste into `apps/storefront/.env.local`.

## Idempotency guarantees

| Entity                | Re-run behavior                                     |
|-----------------------|-----------------------------------------------------|
| Admin user            | `medusa user` errors → `\|\| true` keeps the chain alive |
| Egypt region          | Looked up by `currency_code=egp`; reused if found   |
| `networking` category | Looked up by handle; reused                         |
| Products              | Looked up by handle; reused                         |
| Variant prices        | Looked up via remote query; only EGP price added if missing |
| Thumbnails            | Skipped when `product.thumbnail` already set        |
| Publishable key       | Looked up by title + type; reused                   |
| Key ↔ channel link    | Created only when the key was just created (avoids a misleading "linked …" log line every re-run) |

Validated by running the command twice on a fresh DB — second run
produces only "already exists" / "skip" log lines and zero new rows.

## What this seed does NOT include

These are deliberately out-of-scope to keep the committed baseline
safe and the local stack obviously distinct from production:

- Real customer records, addresses, or PII
- Real orders, carts, payments, refunds, returns
- Stripe / payment provider secrets, webhook secrets
- `JWT_SECRET`, `COOKIE_SECRET`, API tokens (the publishable token is
  generated locally by Medusa, not copied from anywhere)
- Password hashes or auth identities (created by `medusa user`)
- Sessions, access/refresh tokens

If a future feature needs e.g. a sample order for testing, add it as
an explicit sanitized fixture inside `seed.ts` — never via a DB dump.

## Optional: deriving fixtures from current GCP/dev data

The current product set in `seed.ts` is hand-rolled. If a maintainer
later wants to enrich the local catalog from current GCP/dev data
(while it is still development data), the safe procedure is:

1. Manually export ONLY the allow-listed tables from the dev database:
   `product`, `product_variant`, `product_option`, `product_option_value`,
   `product_category`, `product_collection`, `region`, `region_country`,
   `currency`, `sales_channel`. These columns are public catalog data.

2. Strip everything else. Specifically NEVER export: `user`,
   `auth_identity`, `provider_identity`, `customer*`, `cart*`, `order*`,
   `payment*`, `refund*`, `return*`, `api_key`, `session*`.

3. Convert the kept rows into deterministic TS literals inside
   `seed.ts` (or split into `apps/backend/src/scripts/fixtures/*.json`
   if it grows past a few products). Use stable handles/SKUs as the
   primary keys for the check-before-create patterns.

4. Re-run `npm run seed:local` twice on a fresh local DB to prove
   idempotency before committing.

This procedure is intentionally manual — there is no automated
GCP/dev → local pipeline in this repo.

## Storefront env values

`apps/storefront/.env.local` only ever holds `NEXT_PUBLIC_*` values
because Next.js bundles them into the client. The two values that
change per local DB are:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY=<pk_… from seed output>
NEXT_PUBLIC_MEDUSA_REGION_ID=<reg_… from seed output>
```

The other three are stable across machines:

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=ar
```

Do NOT put backend secrets (`JWT_SECRET`, `COOKIE_SECRET`,
`DATABASE_URL`, Stripe keys) in this file — they would be shipped to
the browser. Backend secrets belong in `apps/backend/.env`.

## Why admin creation lives in the npm script, not in `seed.ts`

Medusa v2 splits authentication across three tables (`user`,
`auth_identity`, `provider_identity`) and hashes passwords through the
`emailpass` provider. Re-implementing that flow inside `seed.ts` would
require us to either copy a known-good password hash (forbidden — the
production hash never enters this repo) or to call the auth provider
manually (fragile and version-coupled to internal Medusa code).

The official `medusa user` CLI does all of this correctly, so the npm
script orchestrates the two steps:

```
"seed:local": "(medusa user -e \"$MEDUSA_ADMIN_EMAIL\" -p \"$MEDUSA_ADMIN_PASSWORD\" || true) && medusa exec ./src/scripts/seed.ts"
```

The script is sh-flavored and is intended to run inside the alpine
backend container (where Medusa's CLI is installed). On Windows hosts,
invoke it via `docker compose exec backend sh -c "…"` as shown in the
TL;DR; do not run it in PowerShell or cmd.exe directly.
