"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { StoreCustomerAddress } from "@/lib/medusa-client";
import { createAddressAction, updateAddressAction } from "../../actions";

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
    <form action={formAction} className="space-y-4" noValidate>
      {isEdit ? (
        <input type="hidden" name="address_id" value={initialAddress?.id ?? ""} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">
            {t("firstNameLabel")}
          </label>
          <input
            name="first_name"
            type="text"
            required
            defaultValue={initialAddress?.first_name ?? ""}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">
            {t("lastNameLabel")}
          </label>
          <input
            name="last_name"
            type="text"
            required
            defaultValue={initialAddress?.last_name ?? ""}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-primary">
          {t("addresses.company")}
        </label>
        <input
          name="company"
          type="text"
          defaultValue={initialAddress?.company ?? ""}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-primary">
          {t("addresses.address1")}
        </label>
        <input
          name="address_1"
          type="text"
          required
          defaultValue={initialAddress?.address_1 ?? ""}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-primary">
          {t("addresses.address2")}
        </label>
        <input
          name="address_2"
          type="text"
          defaultValue={initialAddress?.address_2 ?? ""}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.city")}
          </label>
          <input
            name="city"
            type="text"
            required
            defaultValue={initialAddress?.city ?? ""}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.country")}
          </label>
          <select
            name="country_code"
            required
            defaultValue={initialAddress?.country_code ?? "eg"}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.province")}
          </label>
          <input
            name="province"
            type="text"
            defaultValue={initialAddress?.province ?? ""}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.postalCode")}
          </label>
          <input
            name="postal_code"
            type="text"
            defaultValue={initialAddress?.postal_code ?? ""}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">
            {t("addresses.phone")} ({t("addresses.phoneOptional")})
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={initialAddress?.phone ?? ""}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="inline-flex items-center gap-2 text-sm text-text-primary">
          <input
            name="is_default_shipping"
            type="checkbox"
            defaultChecked={Boolean(initialAddress?.is_default_shipping)}
            className="h-4 w-4 rounded border-border"
          />
          {t("addresses.defaultShippingToggle")}
        </label>
      </div>

      {state.error ? (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-success" role="status">
          {isEdit ? t("addresses.updateSuccess") : t("addresses.createSuccess")}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-opacity hover:bg-brand-hover disabled:opacity-50"
        >
          {t("addresses.saveCta")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-subtle"
        >
          {t("addresses.cancelCta")}
        </button>
      </div>
    </form>
  );
}
