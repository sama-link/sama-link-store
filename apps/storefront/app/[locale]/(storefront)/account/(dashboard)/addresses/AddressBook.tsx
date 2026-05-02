"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import type { StoreCustomerAddress } from "@/lib/medusa-client";
import { deleteAddressAction } from "../../actions";
import AddressForm from "./AddressForm";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, Building2, Phone, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

type ActionState = { error?: string; success?: boolean };
const initialState: ActionState = {};

export default function AddressBook({
  addresses,
  locale
}: {
  addresses: StoreCustomerAddress[];
  locale?: string;
}) {
  const t = useTranslations("account");
  const [showAddForm, setShowAddForm] = useState(addresses.length === 0);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [confirmDeleteAddressId, setConfirmDeleteAddressId] = useState<string | null>(null);
  
  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteAddressAction,
    initialState,
  );

  const isArabic = locale === "ar";

  if (addresses.length === 0) {
    return (
      <div className="space-y-6">
        {!showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle p-12 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted text-brand">
              <MapPin className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-text-primary">{t("addresses.empty.heading")}</h2>
            <p className="mb-6 text-sm text-text-secondary max-w-sm">{t("addresses.empty.body")}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow"
            >
              <Plus className="h-4 w-4" />
              {t("addresses.addCta")}
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-2xl border border-brand/20 bg-brand-muted/10 p-1"
            >
              <div className="rounded-xl bg-surface p-5 sm:p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Plus className="h-5 w-5 text-brand" />
                  {isArabic ? "إضافة عنوان جديد" : "Add New Address"}
                </h3>
                <AddressForm mode="create" onCancel={() => setShowAddForm(addresses.length === 0 ? true : false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {isArabic ? `عناويني (${addresses.length})` : `My Addresses (${addresses.length})`}
        </h2>
        {!showAddForm && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setEditingAddressId(null);
              setConfirmDeleteAddressId(null);
            }}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("addresses.addCta")}</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl border border-brand/20 bg-brand-muted/10 p-1"
          >
            <div className="rounded-xl bg-surface p-5 sm:p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-semibold text-text-primary flex items-center gap-2">
                <Plus className="h-5 w-5 text-brand" />
                {isArabic ? "إضافة عنوان جديد" : "Add New Address"}
              </h3>
              <AddressForm mode="create" onCancel={() => setShowAddForm(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteState.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-xl bg-error-muted p-4 text-sm text-error"
          >
            <AlertCircle className="h-5 w-5" />
            {deleteState.error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {addresses.map((address) => {
          const isEditing = editingAddressId === address.id;
          const isConfirmingDelete = confirmDeleteAddressId === address.id;
          const fullName = [address.first_name, address.last_name]
            .filter(Boolean)
            .join(" ");

          if (isEditing) {
            return (
              <motion.div
                key={`edit-${address.id}`}
                layoutId={`card-${address.id}`}
                className="col-span-1 lg:col-span-2 rounded-2xl border border-brand/20 bg-brand-muted/10 p-1"
              >
                <div className="rounded-xl bg-surface p-5 sm:p-6 shadow-sm">
                  <h3 className="mb-6 text-lg font-semibold text-text-primary flex items-center gap-2">
                    <Edit2 className="h-5 w-5 text-brand" />
                    {isArabic ? "تعديل العنوان" : "Edit Address"}
                  </h3>
                  <AddressForm
                    mode="edit"
                    initialAddress={address}
                    onCancel={() => setEditingAddressId(null)}
                  />
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={address.id}
              layoutId={`card-${address.id}`}
              className={`relative overflow-hidden rounded-2xl border transition-all ${
                address.is_default_shipping 
                  ? "border-brand shadow-sm" 
                  : "border-border hover:border-brand-muted hover:shadow-sm"
              }`}
            >
              {address.is_default_shipping && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-brand px-3 py-1.5 text-xs font-medium text-white shadow-sm">
                  {t("addresses.defaultBadge")}
                </div>
              )}
              
              <div className="p-5 sm:p-6 h-full flex flex-col">
                <div className="mb-4 pr-16">
                  <h3 className="text-base font-semibold text-text-primary">
                    {fullName || t("addresses.unnamed")}
                  </h3>
                </div>

                <div className="space-y-3 flex-grow text-sm text-text-secondary">
                  {address.company && (
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                      <span>{address.company}</span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                    <div>
                      <p>{address.address_1}</p>
                      {address.address_2 && <p>{address.address_2}</p>}
                      <p className="mt-0.5">
                        {[address.city, address.province, address.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="mt-0.5 font-medium">{address.country_code?.toUpperCase()}</p>
                    </div>
                  </div>

                  {address.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                      <span dir="ltr" className="text-right">{address.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  {isConfirmingDelete ? (
                    <div className="rounded-xl bg-error-muted/50 p-4">
                      <p className="mb-3 text-sm font-medium text-text-primary text-center">
                        {isArabic ? "هل أنت متأكد من حذف هذا العنوان؟" : "Are you sure you want to delete this address?"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAddressId(null)}
                          disabled={isDeleting}
                          className="flex-1 rounded-lg border border-border bg-surface py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-subtle disabled:opacity-50"
                        >
                          {t("addresses.deleteCancelCta")}
                        </button>
                        <form action={deleteFormAction} className="flex-1">
                          <input type="hidden" name="address_id" value={address.id} />
                          <button
                            type="submit"
                            disabled={isDeleting}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-error py-2 text-sm font-medium text-white transition-all hover:bg-error/90 disabled:opacity-70"
                          >
                            {isDeleting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span> : <Trash2 className="h-4 w-4" />}
                            {t("addresses.deleteConfirmCta")}
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddressId(address.id ?? null);
                          setConfirmDeleteAddressId(null);
                          setShowAddForm(false);
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-subtle"
                      >
                        <Edit2 className="h-4 w-4" />
                        {t("addresses.editCta")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAddressId(address.id ?? null)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-error/20 bg-error-muted/30 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-muted hover:border-error/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("addresses.deleteCta")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
