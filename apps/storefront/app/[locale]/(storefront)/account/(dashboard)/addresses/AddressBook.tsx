"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import type { StoreCustomerAddress } from "@/lib/medusa-client";
import { deleteAddressAction } from "../../actions";
import AddressForm from "./AddressForm";

type ActionState = { error?: string; success?: boolean };
const initialState: ActionState = {};

export default function AddressBook({
  addresses,
}: {
  addresses: StoreCustomerAddress[];
}) {
  const t = useTranslations("account");
  const [showAddForm, setShowAddForm] = useState(addresses.length === 0);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [confirmDeleteAddressId, setConfirmDeleteAddressId] = useState<string | null>(
    null,
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteAddressAction,
    initialState,
  );

  if (addresses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface-subtle p-4">
          <h2 className="text-lg font-medium text-text-primary">{t("addresses.empty.heading")}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t("addresses.empty.body")}</p>
        </div>
        {showAddForm ? (
          <div className="rounded-md border border-border bg-surface p-4">
            <AddressForm mode="create" onCancel={() => setShowAddForm(false)} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          setShowAddForm((v) => !v);
          setEditingAddressId(null);
        }}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-subtle"
      >
        {t("addresses.addCta")}
      </button>

      {showAddForm ? (
        <div className="rounded-md border border-border bg-surface p-4">
          <AddressForm mode="create" onCancel={() => setShowAddForm(false)} />
        </div>
      ) : null}

      {deleteState.error ? (
        <p className="text-sm text-error" role="alert">
          {deleteState.error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {addresses.map((address) => {
          const isEditing = editingAddressId === address.id;
          const isConfirmingDelete = confirmDeleteAddressId === address.id;
          const fullName = [address.first_name, address.last_name]
            .filter(Boolean)
            .join(" ");

          return (
            <li key={address.id} className="rounded-md border border-border bg-surface p-4">
              {isEditing ? (
                <AddressForm
                  mode="edit"
                  initialAddress={address}
                  onCancel={() => setEditingAddressId(null)}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">
                      {fullName || t("addresses.unnamed")}
                    </p>
                    {address.is_default_shipping ? (
                      <span className="rounded-full bg-brand-muted px-2 py-1 text-xs font-medium text-brand">
                        {t("addresses.defaultBadge")}
                      </span>
                    ) : null}
                  </div>

                  <div className="text-sm text-text-secondary">
                    {address.company ? <p>{address.company}</p> : null}
                    <p>{address.address_1}</p>
                    {address.address_2 ? <p>{address.address_2}</p> : null}
                    <p>
                      {[address.city, address.province, address.postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p>{address.country_code?.toUpperCase()}</p>
                    {address.phone ? <p>{address.phone}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {isConfirmingDelete ? (
                      <>
                        <form action={deleteFormAction}>
                          <input type="hidden" name="address_id" value={address.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-error px-3 py-1.5 text-sm font-medium text-text-inverse"
                          >
                            {t("addresses.deleteConfirmCta")}
                          </button>
                        </form>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAddressId(null)}
                          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-subtle"
                        >
                          {t("addresses.deleteCancelCta")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddressId(address.id ?? null);
                            setConfirmDeleteAddressId(null);
                            setShowAddForm(false);
                          }}
                          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-subtle"
                        >
                          {t("addresses.editCta")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAddressId(address.id ?? null)}
                          className="rounded-md border border-error bg-surface px-3 py-1.5 text-sm font-medium text-error hover:bg-error-muted"
                        >
                          {t("addresses.deleteCta")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
