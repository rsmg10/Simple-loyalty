"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useI18n } from "./I18nProvider";
import { eyebrowClass, inputClass, linkButtonClass, panelClass, primaryButtonClass, secondaryButtonClass } from "./ui";
import { MAX_WELCOME_BONUS, WEEKDAYS } from "@/lib/promotions";
import { saveShopConfig, useShopConfig } from "@/lib/shop-config";

const MIN_STAMPS_REQUIRED = 3;
const MAX_STAMPS_REQUIRED = 20;
const LOGO_SIZE = 256;

// Dark enough for white text on the card's "reward waiting" banner.
const BRAND_COLORS = ["#1a3a3a", "#8a4b08", "#7a1f3d", "#1f4e79", "#2f5d34", "#4b2e83"];

// Shrinks the chosen image to a 256px square (cropping the middle) and
// returns it as a data URL — small enough to store with the shop.
async function toLogoDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = LOGO_SIZE;
  canvas.height = LOGO_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No canvas");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    LOGO_SIZE,
    LOGO_SIZE,
  );
  const webp = canvas.toDataURL("image/webp", 0.85);
  // Older Safari can't encode WebP and silently returns PNG — either is fine.
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
}

export default function SettingsForm() {
  const { locale, t } = useI18n();
  const config = useShopConfig();
  const [shopName, setShopName] = useState("");
  const [stampsRequired, setStampsRequired] = useState("");
  const [staffPin, setStaffPin] = useState("");
  const [rewardName, setRewardName] = useState("");
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [welcomeBonus, setWelcomeBonus] = useState(0);
  const [doubleDays, setDoubleDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Seed the form once the current config has loaded — not on every
  // change, or it would clobber the owner's in-progress edits.
  useEffect(() => {
    if (!config.loading) {
      setShopName(config.shopName);
      setStampsRequired(String(config.stampsRequired));
      setRewardName(config.rewardName ?? "");
      setBrandColor(config.brandColor);
      setWelcomeBonus(config.welcomeBonus);
      setDoubleDays(config.doubleStampWeekdays);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.loading]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);

    const trimmedName = shopName.trim();
    const stampsNumber = Number(stampsRequired);
    const trimmedPin = staffPin.trim();

    if (!trimmedName) return setError(t.setup.nameEmpty);
    if (!Number.isInteger(stampsNumber) || stampsNumber < MIN_STAMPS_REQUIRED || stampsNumber > MAX_STAMPS_REQUIRED) {
      return setError(t.setup.stampsRange(MIN_STAMPS_REQUIRED, MAX_STAMPS_REQUIRED));
    }
    if (trimmedPin && trimmedPin.length < 4) return setError(t.setup.pinTooShort);

    setError(null);
    setSubmitting(true);
    const result = await saveShopConfig({
      shopName: trimmedName,
      stampsRequired: stampsNumber,
      staffPin: trimmedPin || undefined,
      rewardName: rewardName.trim() || null,
      brandColor,
      welcomeBonus,
      doubleStampWeekdays: [...doubleDays].sort(),
    });
    setSubmitting(false);

    if (!result.ok) {
      // Server messages are English-only; Arabic gets the generic message.
      return setError(locale === "en" ? result.error : t.setup.saveFailed);
    }
    setStaffPin("");
    setSaved(true);
    config.reload();
  }

  async function uploadLogo(dataUrl: string | null) {
    setLogoError(false);
    const res = await fetch("/api/shop/logo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    }).catch(() => null);
    if (res?.ok) config.reload();
    else setLogoError(true);
  }

  async function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await uploadLogo(await toLogoDataUrl(file));
    } catch {
      setLogoError(true);
    }
  }

  const toggleDay = (day: number) =>
    setDoubleDays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));

  return (
    <div className={panelClass}>
      <p className={eyebrowClass}>{t.setup.eyebrow}</p>
      <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">{t.setup.title}</h1>
      <p className="mt-xs text-body-sm text-muted">{t.setup.description}</p>

      <form onSubmit={handleSubmit} className="mt-lg space-y-md">
        <label className="block">
          <span className="text-title-sm font-semibold text-ink">{t.setup.shopName}</span>
          <input value={shopName} onChange={(e) => setShopName(e.target.value)} className={`${inputClass} mt-xxs`} />
        </label>

        <label className="block">
          <span className="text-title-sm font-semibold text-ink">{t.setup.stampsRequired}</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_STAMPS_REQUIRED}
            max={MAX_STAMPS_REQUIRED}
            value={stampsRequired}
            onChange={(e) => setStampsRequired(e.target.value)}
            className={`${inputClass} mt-xxs`}
          />
        </label>

        <label className="block">
          <span className="text-title-sm font-semibold text-ink">{t.settingsExtra.rewardName}</span>
          <input
            value={rewardName}
            maxLength={40}
            onChange={(e) => setRewardName(e.target.value)}
            placeholder={t.settingsExtra.rewardNamePlaceholder}
            className={`${inputClass} mt-xxs`}
          />
          <span className="mt-xxs block text-caption text-muted">{t.settingsExtra.rewardNameHint}</span>
        </label>

        <fieldset>
          <legend className="text-title-sm font-semibold text-ink">{t.settingsExtra.brandColor}</legend>
          <div className="mt-xs flex flex-wrap gap-xs">
            <button
              type="button"
              onClick={() => setBrandColor(null)}
              aria-pressed={brandColor === null}
              className={`h-9 rounded-pill border px-sm text-caption font-semibold text-ink ${brandColor === null ? "border-ink ring-2 ring-ink" : "border-hairline"}`}
            >
              {t.settingsExtra.defaultColor}
            </button>
            {BRAND_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setBrandColor(color)}
                aria-pressed={brandColor === color}
                aria-label={color}
                className={`h-9 w-9 rounded-full ${brandColor === color ? "ring-2 ring-ink ring-offset-2 ring-offset-canvas" : ""}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </fieldset>

        <div>
          <p className="text-title-sm font-semibold text-ink">{t.settingsExtra.logo}</p>
          <div className="mt-xs flex items-center gap-sm">
            {config.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- tiny, already-sized image from our own API
              <img src={config.logoUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
            )}
            <label className={`${secondaryButtonClass} flex cursor-pointer items-center`}>
              {t.settingsExtra.logoUpload}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoFile} className="sr-only" />
            </label>
            {config.logoUrl && (
              <button type="button" onClick={() => uploadLogo(null)} className={linkButtonClass}>
                {t.settingsExtra.logoRemove}
              </button>
            )}
          </div>
          <p className="mt-xxs text-caption text-muted">{logoError ? t.settingsExtra.logoError : t.settingsExtra.logoHint}</p>
        </div>

        <fieldset className="border-t border-hairline pt-md">
          <legend className="text-title-sm font-semibold text-ink">{t.settingsExtra.promotions}</legend>
          <label className="mt-xs block">
            <span className="text-body-sm text-ink">{t.settingsExtra.welcomeBonus}</span>
            <select
              value={welcomeBonus}
              onChange={(e) => setWelcomeBonus(Number(e.target.value))}
              className={`${inputClass} mt-xxs`}
            >
              {Array.from({ length: MAX_WELCOME_BONUS + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {t.settingsExtra.welcomeBonusOption(n)}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-sm text-body-sm text-ink">{t.settingsExtra.doubleDays}</p>
          <div className="mt-xxs flex flex-wrap gap-xs">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={doubleDays.includes(day)}
                className={`h-9 rounded-pill px-sm text-caption font-semibold ${
                  doubleDays.includes(day) ? "bg-primary text-on-primary" : "border border-hairline text-ink"
                }`}
              >
                {t.weekdaysShort[day]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block border-t border-hairline pt-md">
          <span className="text-title-sm font-semibold text-ink">{t.setup.newPin}</span>
          <input
            value={staffPin}
            onChange={(e) => setStaffPin(e.target.value)}
            inputMode="numeric"
            placeholder={t.setup.newPinPlaceholder}
            className={`${inputClass} mt-xxs`}
          />
          <span className="mt-xxs block text-caption text-muted">{t.settingsExtra.managerPinNote}</span>
        </label>

        {error && (
          <p className="text-body-sm text-error" role="alert">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="text-body-sm text-muted" role="status">
            {t.setup.saved}
          </p>
        )}

        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {t.setup.save}
        </button>
      </form>
    </div>
  );
}
