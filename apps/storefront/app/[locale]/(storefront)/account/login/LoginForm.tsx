"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

interface LoginFormProps {
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
}

const initialState: { error?: string } = {};

export default function LoginForm({
  emailLabel,
  passwordLabel,
  submitLabel,
}: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label
          htmlFor="account-login-email"
          className="block text-sm font-medium text-text-primary"
        >
          {emailLabel}
        </label>
        <input
          id="account-login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="account-login-password"
          className="block text-sm font-medium text-text-primary"
        >
          {passwordLabel}
        </label>
        <input
          id="account-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
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
