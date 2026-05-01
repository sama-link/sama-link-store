import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const isLocalEnv =
  process.env.NODE_ENV === "development" ||
  process.env.DATABASE_URL?.includes("@postgres:") ||
  process.env.DATABASE_URL?.includes("@localhost:");

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: isLocalEnv
      ? { connection: { ssl: false } }
      : { connection: { ssl: { rejectUnauthorized: false } } },
    // In local Docker dev we run the admin over plain HTTP on localhost.
    // Medusa defaults admin session cookies to `Secure; SameSite=None`
    // when NODE_ENV=production, which the browser silently rejects over
    // HTTP — the admin sign-in loop returns to /app/login with no
    // connect.sid cookie ever being accepted. Relaxing these two flags
    // only when `isLocalEnv` keeps production behaviour intact.
    cookieOptions: isLocalEnv
      ? { secure: false, sameSite: "lax" as const }
      : undefined,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  // Sama Link custom modules — ADR-047, ADR-053.
  //   brand:         first-class brand catalog surfaced as a native admin
  //                  resource with CRUD pages at /app/brands and a picker
  //                  widget on product details. Replaces the old
  //                  string-in-metadata approach.
  //   customer_list: customer-scoped wishlist + compare collections,
  //                  unified under one module with a `list_type`
  //                  discriminator (ADR-053). Routes ship under ACCT-6B.
  modules: [
    {
      resolve: "./src/modules/brand",
    },
    {
      resolve: "./src/modules/translation",
    },
    {
      resolve: "./src/modules/customer_list",
    },
  ],
});
