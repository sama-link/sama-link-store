"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Container from "@/components/layout/Container";

/* ADR-045 flat refresh — Newsletter.
   Form submit is a no-op stub (BACK-7 will wire a real list endpoint).
   UX always shows a valid success state on submit so the form doesn't look broken. */
export default function NewsletterSection() {
  const t = useTranslations("home.sections.newsletter");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="bg-surface">
      <Container className="py-14">
        <div className="relative overflow-hidden rounded-2xl bg-brand text-text-inverse">
          {/* Decorative rings — animated like hero */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-24 top-1/2 flex -translate-y-1/2 items-center justify-center opacity-75"
          >
            <span
              className="absolute h-[384px] w-[384px] rounded-full border border-text-inverse/10"
              style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "0s" }}
            />
            <span
              className="absolute h-[512px] w-[512px] rounded-full border border-text-inverse/10"
              style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "1s" }}
            />
            <span
              className="absolute h-[640px] w-[640px] rounded-full border border-text-inverse/10"
              style={{ animation: "ring-pulse 4s ease-out infinite", animationDelay: "2s" }}
            />
          </div>
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-text-inverse/75">
                {t("eyebrow")}
              </div>
              <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">
                {t("title")}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-inverse/80">
                {t("body")}
              </p>
            </div>

            {submitted ? (
              <div
                role="status"
                className="rounded-xl border border-text-inverse/20 bg-white/5 p-5 text-sm"
              >
                <div className="font-semibold">{t("success.title")}</div>
                <div className="mt-1 text-text-inverse/80">{t("success.body")}</div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email) return;
                  /* Stub — BACK-7 will wire a real subscription API. */
                  setSubmitted(true);
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="newsletter-email" className="sr-only">
                    {t("emailLabel")}
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("placeholder")}
                    className="h-12 w-full rounded-lg border border-transparent bg-white px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-text-inverse/30"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-text-primary px-6 text-sm font-semibold text-text-inverse transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-[0.96] active:translate-y-0 active:shadow-sm"
                  >
                    {t("subscribe")}
                  </button>
                </div>
                <p className="text-xs text-text-inverse/75">{t("privacy")}</p>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
