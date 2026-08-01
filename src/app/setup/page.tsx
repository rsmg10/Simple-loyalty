"use client";

import { useState } from "react";
import ShopSetupForm from "@/components/ShopSetupForm";
import StaffPinGate from "@/components/StaffPinGate";

export default function SetupPage() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
      {unlocked ? <ShopSetupForm /> : <StaffPinGate onUnlock={() => setUnlocked(true)} />}
    </main>
  );
}
