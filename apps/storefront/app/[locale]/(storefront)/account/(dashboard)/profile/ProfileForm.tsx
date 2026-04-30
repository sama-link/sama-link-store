"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useLocale } from "next-intl";
import { profileUpdateAction } from "../../actions";

type ActionState = { error?: string; success?: boolean };

const initialState: ActionState = {};

interface ProfileFormProps {
  firstName: string;
  lastName: string;
  phone: string;
  firstNameLabel: string;
  lastNameLabel: string;
  phoneLabel: string;
  phoneOptionalLabel: string;
  saveLabel: string;
  cancelLabel: string;
  successLabel: string;
}

export default function ProfileForm({
  firstName,
  lastName,
  phone,
  firstNameLabel,
  lastNameLabel,
  phoneLabel,
  phoneOptionalLabel,
  saveLabel,
  cancelLabel,
  successLabel,
}: ProfileFormProps) {
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    profileUpdateAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="account-profile-first-name"
            className="block text-sm font-medium text-text-primary"
          >
            {firstNameLabel}
          </label>
          <input
            id="account-profile-first-name"
            name="first_name"
            type="text"
            required
            defaultValue={firstName}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="account-profile-last-name"
            className="block text-sm font-medium text-text-primary"
          >
            {lastNameLabel}
          </label>
          <input
            id="account-profile-last-name"
            name="last_name"
            type="text"
            required
            defaultValue={lastName}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="account-profile-phone"
          className="block text-sm font-medium text-text-primary"
        >
          {phoneLabel} <span className="text-text-muted">({phoneOptionalLabel})</span>
        </label>
        <input
          id="account-profile-phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-success" role="status">
          {successLabel}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover disabled:opacity-50"
        >
          {saveLabel}
        </button>
        <Link
          href={`/${locale}/account`}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-subtle"
        >
          {cancelLabel}
        </Link>
      </div>
    </form>
  );
}
