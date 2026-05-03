"use client";

import { useState, useEffect } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import {
  updateCartShippingAddress,
  type ShippingAddressPayload,
  type StoreCustomerAddress,
} from "@/lib/medusa-client";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  MapPin, 
  Building2, 
  Phone, 
  Globe, 
  Mailbox,
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import DropdownSelect from "@/components/ui/DropdownSelect";

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

const REQUIRED_FIELDS: (keyof ShippingAddressPayload)[] = [
  "first_name",
  "last_name",
  "address_1",
  "city",
  "country_code",
];

const inputClass =
  "block w-full rounded-xl border border-border bg-surface py-3 ps-10 pe-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-brand focus:outline-none focus:ring-0 disabled:opacity-50";

function Field({
  label,
  required,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  icon: React.ElementType;
  children: React.ReactElement;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-primary">
        {label}
        {required ? (
          <span className="ms-0.5 text-error" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
          <Icon className="h-5 w-5 text-text-muted" />
        </div>
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-error"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AddressFormProps {
  locale: string;
  savedAddresses?: StoreCustomerAddress[];
  regionCountryCodes?: string[];
}

type FormData = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  country_code: string;
  province: string;
  postal_code: string;
  phone: string;
};

const emptyForm: FormData = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  country_code: "",
  province: "",
  postal_code: "",
  phone: "",
};

type SavedAddressOption = {
  key: string;
  address: StoreCustomerAddress;
};

function mapAddressToFormData(address: StoreCustomerAddress): FormData {
  return {
    first_name: address.first_name ?? "",
    last_name: address.last_name ?? "",
    address_1: address.address_1 ?? "",
    address_2: address.address_2 ?? "",
    city: address.city ?? "",
    country_code: (address.country_code ?? "").toLowerCase(),
    province: address.province ?? "",
    postal_code: address.postal_code ?? "",
    phone: address.phone ?? "",
  };
}

function hasShippingAddress(address: Partial<FormData> | null | undefined): boolean {
  if (!address) return false;
  return Boolean(
    address.first_name ||
      address.last_name ||
      address.address_1 ||
      address.city ||
      address.country_code,
  );
}

function formatSavedAddressLabel(
  address: StoreCustomerAddress,
  fallbackLabel: string,
): string {
  const name = [address.first_name, address.last_name].filter(Boolean).join(" ");
  const line = [address.address_1, address.city, address.country_code?.toUpperCase()]
    .filter(Boolean)
    .join(", ");
  if (name && line) return `${name} - ${line}`;
  return name || line || fallbackLabel;
}

export default function AddressForm({
  locale,
  savedAddresses = [],
  regionCountryCodes = [],
}: AddressFormProps) {
  const t = useTranslations("checkout.address");
  const router = useRouter();
  const { cart, loading: cartLoading } = useCart();
  const isArabic = locale === "ar";

  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [initialized, setInitialized] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [selectedSavedAddressKey, setSelectedSavedAddressKey] = useState("");

  const savedAddressOptions = useMemo<SavedAddressOption[]>(() => {
    const allowedCountryCodes = new Set(
      regionCountryCodes.map((code) => code.toLowerCase()),
    );
    const addressesInRegion = savedAddresses.filter((address) => {
      const countryCode = address.country_code?.toLowerCase();
      if (!countryCode) return false;
      if (allowedCountryCodes.size === 0) return true;
      return allowedCountryCodes.has(countryCode);
    });
    return addressesInRegion.map((address, index) => ({
      key: address.id ?? `saved-${index}`,
      address,
    }));
  }, [regionCountryCodes, savedAddresses]);

  const preferredSavedAddress = useMemo<SavedAddressOption | null>(() => {
    if (savedAddressOptions.length === 0) return null;
    const explicitDefault = savedAddressOptions.find(
      (entry) => entry.address.is_default_shipping,
    );
    if (explicitDefault) return explicitDefault;

    const sorted = [...savedAddressOptions].sort((a, b) => {
      const aTime = Date.parse(
        String((a.address as { updated_at?: string | null }).updated_at ?? ""),
      );
      const bTime = Date.parse(
        String((b.address as { updated_at?: string | null }).updated_at ?? ""),
      );
      if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
        return bTime - aTime;
      }
      return a.key.localeCompare(b.key);
    });
    return sorted[0] ?? null;
  }, [savedAddressOptions]);

  useEffect(() => {
    if (!cart || initialized) return;
    const id = window.requestAnimationFrame(() => {
      const addr = cart.shipping_address;
      if (addr && hasShippingAddress(addr)) {
        setFormData({
          first_name: addr.first_name ?? "",
          last_name: addr.last_name ?? "",
          address_1: addr.address_1 ?? "",
          address_2: addr.address_2 ?? "",
          city: addr.city ?? "",
          country_code: addr.country_code ?? "",
          province: addr.province ?? "",
          postal_code: addr.postal_code ?? "",
          phone: addr.phone ?? "",
        });
      } else if (preferredSavedAddress) {
        setFormData(mapAddressToFormData(preferredSavedAddress.address));
        setSelectedSavedAddressKey(preferredSavedAddress.key);
      }
      setInitialized(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [cart, initialized, preferredSavedAddress]);

  useEffect(() => {
    if (!selectedSavedAddressKey) return;
    const stillExists = savedAddressOptions.some(
      (entry) => entry.key === selectedSavedAddressKey,
    );
    if (!stillExists) {
      setSelectedSavedAddressKey("");
    }
  }, [savedAddressOptions, selectedSavedAddressKey]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSavedAddressChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = e.target;
    setSelectedSavedAddressKey(value);
    const selected = savedAddressOptions.find((entry) => entry.key === value);
    if (!selected) return;
    setFormData(mapAddressToFormData(selected.address));
    setErrors({});
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormData, string>> = {};
    for (const field of REQUIRED_FIELDS) {
      if (!formData[field].trim()) {
        next[field] = t("required");
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !cart) return;

    setSubmitting(true);
    setApiError("");

    const payload: ShippingAddressPayload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      address_1: formData.address_1.trim(),
      city: formData.city.trim(),
      country_code: formData.country_code,
    };
    if (formData.address_2.trim()) payload.address_2 = formData.address_2.trim();
    if (formData.province.trim()) payload.province = formData.province.trim();
    if (formData.postal_code.trim())
      payload.postal_code = formData.postal_code.trim();
    if (formData.phone.trim()) payload.phone = formData.phone.trim();

    try {
      await updateCartShippingAddress(cart.id, payload);
      router.push(`/${locale}/checkout/shipping`);
    } catch (err: any) {
      console.error("Address save error:", err);
      // Try to extract the actual Medusa error message
      const errorMsg = err?.response?.data?.message || err?.message || t("error");
      setApiError(typeof errorMsg === 'string' ? errorMsg : t("error"));
      setSubmitting(false);
    }
  }

  const disabled = cartLoading || submitting;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      className="space-y-6"
    >
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
          <MapPin className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary">
          {t("title")}
        </h2>
      </div>

      {savedAddressOptions.length > 0 ? (
        <div className="space-y-2 rounded-xl bg-surface-subtle p-5">
          <label
            htmlFor="saved-address-select"
            className="block text-sm font-medium text-text-primary"
          >
            {t("savedAddressesLabel")}
          </label>
          <div className="relative z-20">
            <div className="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center ps-3">
              <MapPin className="h-5 w-5 text-text-muted" />
            </div>
            <DropdownSelect
              value={selectedSavedAddressKey}
              onChange={(val) => {
                setSelectedSavedAddressKey(val);
                const selected = savedAddressOptions.find((entry) => entry.key === val);
                if (selected) {
                  setFormData(mapAddressToFormData(selected.address));
                  setErrors({});
                }
              }}
              options={[
                { value: "", label: t("savedAddressesPlaceholder") },
                ...savedAddressOptions.map((entry) => ({
                  value: entry.key,
                  label: formatSavedAddressLabel(entry.address, t("savedAddressFallback"))
                }))
              ]}
              disabled={disabled}
              className={cn(inputClass, "ps-[44px]")}
            />
          </div>
          <p className="text-xs text-text-muted">{t("savedAddressesHint")}</p>
        </div>
      ) : null}

      <div className="space-y-5 pt-2">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t("firstName")} required error={errors.first_name} icon={User}>
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={disabled}
              autoComplete="given-name"
              className={inputClass}
            />
          </Field>
          <Field label={t("lastName")} required error={errors.last_name} icon={User}>
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={disabled}
              autoComplete="family-name"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={t("address1")} required error={errors.address_1} icon={MapPin}>
          <input
            name="address_1"
            value={formData.address_1}
            onChange={handleChange}
            disabled={disabled}
            autoComplete="address-line1"
            className={inputClass}
          />
        </Field>

        <Field label={t("address2")} error={errors.address_2} icon={Building2}>
          <input
            name="address_2"
            value={formData.address_2}
            onChange={handleChange}
            disabled={disabled}
            autoComplete="address-line2"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t("city")} required error={errors.city} icon={Building2}>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={disabled}
              autoComplete="address-level2"
              className={inputClass}
            />
          </Field>
          <Field label={t("country")} required error={errors.country_code} icon={Globe}>
            <div className="relative z-10">
              <DropdownSelect
                value={formData.country_code}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, country_code: val }));
                  setErrors((prev) => ({ ...prev, country_code: undefined }));
                }}
                options={[
                  { value: "", label: t("selectCountry") },
                  ...COUNTRIES
                    .filter(c => regionCountryCodes.length === 0 || regionCountryCodes.includes(c.code))
                    .map((c) => ({ value: c.code, label: c.name }))
                ]}
                disabled={disabled}
                className={cn(inputClass, "ps-[44px]")}
              />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t("province")} error={errors.province} icon={MapPin}>
            <input
              name="province"
              value={formData.province}
              onChange={handleChange}
              disabled={disabled}
              autoComplete="address-level1"
              className={inputClass}
            />
          </Field>
          <Field label={t("postalCode")} error={errors.postal_code} icon={Mailbox}>
            <input
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              disabled={disabled}
              autoComplete="postal-code"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={t("phone")} error={errors.phone} icon={Phone}>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            disabled={disabled}
            autoComplete="tel"
            className={inputClass}
            dir="ltr"
          />
        </Field>
      </div>

      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-error-muted p-4 text-sm text-error">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p role="alert">{apiError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-end border-t border-border pt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={disabled}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md disabled:opacity-70 disabled:hover:scale-100"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              {t("continue")}
              <ChevronRight className={cn("h-5 w-5", isArabic && "rotate-180")} />
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
