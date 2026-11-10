"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import LanguageToggle from "@/components/LanguageToggle";
import StaffPinGate from "@/components/StaffPinGate";
import StampScanner from "@/components/StampScanner";

export default function StaffPage() {
  const { t } = useI18n();
  const [unlocked, setUnlocked] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-canvas p-lg">
      {unlocked ? <StampScanner /> : <StaffPinGate onUnlock={() => setUnlocked(true)} />}
      <Link href="/setup" className="text-body-sm text-muted underline underline-offset-2">
        {t.staff.setupLink}
      </Link>
      <LanguageToggle />
    </main>
  );
}
