"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "./I18nProvider";
import { eyebrowClass, inputClass, linkButtonClass, panelClass, primaryButtonClass } from "./ui";
import { useJson } from "@/lib/shop-config";
import type { StaffMember } from "@/lib/staff-repo";

type ErrorCode = "invalid_name" | "invalid_pin" | "pin_taken" | "failed";

export default function StaffManager() {
  const { t } = useI18n();
  const { data, reload } = useJson<{ staff: StaffMember[] }>("/api/shop/staff");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/shop/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setName("");
      setPin("");
      reload();
      return;
    }
    const code = (await res?.json().catch(() => null))?.code as ErrorCode | undefined;
    setError(code && code in t.staffMgmt.errors ? code : "failed");
  }

  async function setActive(member: StaffMember, active: boolean) {
    await fetch(`/api/shop/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    }).catch(() => null);
    reload();
  }

  return (
    <div className={panelClass}>
      <p className={eyebrowClass}>{t.staffMgmt.title}</p>
      <p className="mt-xs text-body-sm text-muted">{t.staffMgmt.description}</p>

      {data && data.staff.length === 0 && <p className="mt-md text-body-sm text-muted">{t.staffMgmt.empty}</p>}
      {data && data.staff.length > 0 && (
        <ul className="mt-md divide-y divide-hairline">
          {data.staff.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-sm py-sm">
              <div>
                <p className="text-body-md text-ink">{member.name}</p>
                <p className="text-caption text-muted">{member.active ? t.staffMgmt.active : t.staffMgmt.inactive}</p>
              </div>
              <button type="button" onClick={() => setActive(member, !member.active)} className={linkButtonClass}>
                {member.active ? t.staffMgmt.turnOff : t.staffMgmt.turnOn}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-md space-y-sm border-t border-hairline pt-md">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t.staffMgmt.name}
          aria-label={t.staffMgmt.name}
          className={inputClass}
        />
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={8}
          placeholder={t.staffMgmt.pin}
          aria-label={t.staffMgmt.pin}
          className={inputClass}
        />
        {error && (
          <p className="text-body-sm text-error" role="alert">
            {t.staffMgmt.errors[error]}
          </p>
        )}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {t.staffMgmt.add}
        </button>
      </form>
    </div>
  );
}
