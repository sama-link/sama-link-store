"use client";

import { useActionState, useState } from "react";
import { loginAction } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MessageCircle, AlertCircle, Loader2 } from "lucide-react";

interface LoginFormProps {
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  comingSoonLabel: string;
  orContinueWithLabel: string;
}

const initialState: { error?: string } = {};

export default function LoginForm({
  emailLabel,
  passwordLabel,
  submitLabel,
  comingSoonLabel,
  orContinueWithLabel,
}: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [activeTab, setActiveTab] = useState<"email" | "phone" | "whatsapp">("email");
  const [showToast, setShowToast] = useState(false);

  const handleComingSoon = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const tabs = [
    { id: "email", icon: Mail, label: "Email" },
    { id: "phone", icon: Phone, label: "Phone" },
    { id: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  ] as const;

  return (
    <div className="relative">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute -top-16 left-0 right-0 z-50 mx-auto flex w-max items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{comingSoonLabel}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="mb-6 flex rounded-xl bg-surface-subtle p-1 shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id !== "email") {
                  handleComingSoon();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-brand shadow-[0_1px_3px_rgb(0,0,0,0.1)]"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-lg bg-surface"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" />
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="account-login-email"
              className="block text-sm font-medium text-text-primary"
            >
              {emailLabel}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-text-muted" />
              </div>
              <input
                id="account-login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-brand focus:outline-none focus:ring-0 disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="account-login-password"
                className="block text-sm font-medium text-text-primary"
              >
                {passwordLabel}
              </label>
              {/* Optional: Forgot password link could go here */}
            </div>
            <div className="relative">
              <input
                id="account-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-brand focus:outline-none focus:ring-0 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          {state.error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-error"
              role="alert"
            >
              {state.error}
            </motion.p>
          )}

          {/* Plain <button>, not motion.button: see RegisterForm comment.
              framer-motion's pointer hooks (whileTap) interfered with
              React 19's form-action submit protocol. */}
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-border"></div>
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-text-muted">
            {orContinueWithLabel}
          </span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleComingSoon}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-subtle"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleComingSoon}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-subtle"
          >
            <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
