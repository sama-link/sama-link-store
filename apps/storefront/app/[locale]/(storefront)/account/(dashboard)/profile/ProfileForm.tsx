"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useLocale } from "next-intl";
import { profileUpdateAction } from "../../actions";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Phone, CheckCircle2, AlertCircle } from "lucide-react";

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
    <form action={formAction} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="account-profile-first-name"
            className="block text-sm font-medium text-text-primary"
          >
            {firstNameLabel}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-text-muted" />
            </div>
            <input
              id="account-profile-first-name"
              name="first_name"
              type="text"
              required
              defaultValue={firstName}
              className="block w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-brand focus:outline-none focus:ring-0 disabled:opacity-50"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="account-profile-last-name"
            className="block text-sm font-medium text-text-primary"
          >
            {lastNameLabel}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-text-muted" />
            </div>
            <input
              id="account-profile-last-name"
              name="last_name"
              type="text"
              required
              defaultValue={lastName}
              className="block w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-brand focus:outline-none focus:ring-0 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="account-profile-phone"
          className="block text-sm font-medium text-text-primary"
        >
          {phoneLabel} <span className="text-text-muted font-normal">({phoneOptionalLabel})</span>
        </label>
        <div className="relative md:max-w-[50%]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Phone className="h-5 w-5 text-text-muted" />
          </div>
          <input
            id="account-profile-phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            className="block w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-brand focus:outline-none focus:ring-0 disabled:opacity-50"
          />
        </div>
      </div>

      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-xl bg-error-muted p-3 text-sm text-error">
              <AlertCircle className="h-5 w-5" />
              {state.error}
            </div>
          </motion.div>
        )}
        
        {state.success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-xl bg-success-muted p-3 text-sm text-success">
              <CheckCircle2 className="h-5 w-5" />
              {successLabel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow disabled:opacity-70 disabled:hover:scale-100"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveLabel}
        </motion.button>
        <Link href={`/${locale}/account`} passHref>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-subtle"
          >
            {cancelLabel}
          </motion.div>
        </Link>
      </div>
    </form>
  );
}
