"use client";

import { useActionState } from "react";
import { registerAction } from "../actions";

interface RegisterFormProps {
  emailLabel: string;
  passwordLabel: string;
  firstNameLabel: string;
  lastNameLabel: string;
  submitLabel: string;
}

const initialState: { error?: string } = {};

export default function RegisterForm({
  emailLabel,
  passwordLabel,
  firstNameLabel,
  lastNameLabel,
  submitLabel,
}: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="account-register-first-name"
            className="block text-sm font-medium text-text-primary"
          >
            {firstNameLabel}
          </label>
          <input
            id="account-register-first-name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            required
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="account-register-last-name"
            className="block text-sm font-medium text-text-primary"
          >
            {lastNameLabel}
          </label>
          <input
            id="account-register-last-name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            required
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="account-register-email"
          className="block text-sm font-medium text-text-primary"
        >
          {emailLabel}
        </label>
        <input
          id="account-register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="account-register-password"
          className="block text-sm font-medium text-text-primary"
        >
          {passwordLabel}
        </label>
        <input
          id="account-register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-brand py-2.5 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}
