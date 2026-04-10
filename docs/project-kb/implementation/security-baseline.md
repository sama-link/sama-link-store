# Security Baseline — Sama Link Store

## Principles

- Security by default — insecure configurations must be explicitly opted into
- Principle of least privilege — every component gets only the access it needs
- Defense in depth — no single point of failure in security controls
- Fail closed — on error, default to denying access

---

## Environment & Secrets

- All secrets in environment variables — never in code
- `NEXT_PUBLIC_*` variables are visible to all browsers — treat as public
- JWT and cookie secrets must be strong random values (32+ bytes)
- Rotate secrets on any suspected exposure
- Never log environment variable values
- `.env` files never committed — enforced via `.gitignore`

---

## Authentication & Authorization

- Medusa JWT for customer auth
- Admin routes protected by Medusa Admin auth
- All admin API calls require valid JWT
- Session cookies: `httpOnly: true`, `secure: true` (production), `sameSite: strict`
- Password reset tokens must be short-lived (< 1 hour)
- Rate limit auth endpoints: login, register, password reset

---

## HTTP Security Headers (production)

Configure these in Next.js `next.config.ts` and/or reverse proxy:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

CSP should be tightened progressively — start restrictive and loosen only when needed.

---

## Input Validation

- Validate all user input server-side using a schema library (e.g. Zod)
- Client-side validation is UX only — never a security control
- Sanitize any user-generated content before storing or rendering
- Parameterized queries only — no raw SQL string concatenation (Medusa/ORM handles this)

---

## Payment Security

- Stripe secret key: server-side only, never in client bundle
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only on client (safe by design)
- Verify Stripe webhook signatures on every webhook event
- Never log full payment details
- Never store raw card data

---

## CORS

- Medusa backend CORS: allow only known origins (storefront URL, admin URL)
- No wildcard `*` in production CORS
- Configure in Medusa `medusa-config.ts`

---

## Dependency Security

- Run `npm audit` before each release
- No critical or high vulnerabilities shipped to production
- Keep dependencies up to date (monthly review minimum)
- Prefer well-maintained packages with active security disclosures

---

## Logging

- Log errors with context, without sensitive data
- Never log: passwords, tokens, full credit card numbers, PII beyond what's needed
- Use structured logging (JSON) for production
- Log authentication events (login success/failure) for audit trail

---

## Infrastructure

- Database: restrict PostgreSQL access to backend app only (network-level firewall)
- Redis: password-protected, not publicly accessible
- Admin panel: behind auth, ideally on a restricted subdomain
- All production traffic over HTTPS
- Disable HTTP (redirect to HTTPS)

---

## Checklist Before Launch (Phase 8)

- [ ] All security headers configured and verified
- [ ] `npm audit` — zero critical/high issues
- [ ] Stripe webhook verification confirmed
- [ ] Auth rate limiting active
- [ ] No sensitive data in logs
- [ ] CORS restricted to known origins
- [ ] Database not publicly accessible
- [ ] HTTPS enforced
- [ ] Environment variable audit: no accidental public exposure
