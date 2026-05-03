"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { StoreCustomerAddress } from "@/lib/medusa-client";
import { createAddressAction, updateAddressAction } from "../../actions";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import DropdownSelect from "@/components/ui/DropdownSelect";

type ActionState = { error?: string; success?: boolean };

const initialState: ActionState = {};

const COUNTRIES = [
  { code: "sa", name: "Saudi Arabia" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "kw", name: "Kuwait" },
  { code: "qa", name: "Qatar" },
  { code: "bh", name: "Bahrain" },
  { code: "om", name: "Oman" },
  { code: "jo", name: "Jordan" },
  { code: "eg", name: "Egypt" },
  { code: "lb", name: "Lebanon" },
  { code: "iq", name: "Iraq" },
] as const;

interface AddressFormProps {
  mode: "create" | "edit";
  initialAddress?: StoreCustomerAddress;
  onCancel: () => void;
}

export default function AddressForm({
  mode,
  initialAddress,
  onCancel,
}: AddressFormProps) {
  const t = useTranslations("account");
  const action = mode === "create" ? createAddressAction : updateAddressAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const isEdit = mode === "edit";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {isEdit ? (
        <input type="hidden" name="address_id" value={initialAddress?.id ?? ""} />
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            {t("firstNameLabel")}
          </label>
          <input
            name="first_name"
            type="text"
            required
            defaultValue={initialAddress?.first_name ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            {t("lastNameLabel")}
          </label>
          <input
            name="last_name"
            type="text"
            required
            defaultValue={initialAddress?.last_name ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-text-primary">
          {t("addresses.company")} <span className="text-text-muted font-normal text-xs">(Optional)</span>
        </label>
        <input
          name="company"
          type="text"
          defaultValue={initialAddress?.company ?? ""}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-text-primary">
          {t("addresses.address1")}
        </label>
        <input
          name="address_1"
          type="text"
          required
          defaultValue={initialAddress?.address_1 ?? ""}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-text-primary">
          {t("addresses.address2")} <span className="text-text-muted font-normal text-xs">(Optional)</span>
        </label>
        <input
          name="address_2"
          type="text"
          defaultValue={initialAddress?.address_2 ?? ""}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.city")}
          </label>
          <input
            name="city"
            type="text"
            required
            defaultValue={initialAddress?.city ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.country")}
          </label>
          <div className="relative z-10">
            <DropdownSelect
              name="country_code"
              defaultValue={initialAddress?.country_code ?? "eg"}
              options={COUNTRIES.map((country) => ({
                value: country.code,
                label: country.name,
              }))}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors hover:border-border-strong"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.province")}
          </label>
          <input
            name="province"
            type="text"
            defaultValue={initialAddress?.province ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.postalCode")}
          </label>
          <input
            name="postal_code"
            type="text"
            defaultValue={initialAddress?.postal_code ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.phone")} <span className="text-text-muted font-normal text-xs">({t("addresses.phoneOptional")})</span>
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={initialAddress?.phone ?? ""}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-brand focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      <div className="pt-2">
        <label className="inline-flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              name="is_default_shipping"
              type="checkbox"
              defaultChecked={Boolean(initialAddress?.is_default_shipping)}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-border transition-all checked:border-brand checked:bg-brand hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            />
            <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </div>
          <span className="text-sm font-medium text-text-primary select-none group-hover:text-brand transition-colors">
            {t("addresses.defaultShippingToggle")}
          </span>
        </label>
      </div>

      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-xl bg-error-muted p-4 text-sm text-error">
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
            <div className="flex items-center gap-2 rounded-xl bg-success-muted p-4 text-sm text-success">
              <CheckCircle2 className="h-5 w-5" />
              {isEdit ? t("addresses.updateSuccess") : t("addresses.createSuccess")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow disabled:opacity-70 disabled:hover:scale-100"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("addresses.saveCta")}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-subtle"
        >
          {t("addresses.cancelCta")}
        </motion.button>
      </div>
    </form>
  );
}
