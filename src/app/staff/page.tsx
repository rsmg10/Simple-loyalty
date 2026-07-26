"use client";

import { useState } from "react";
import StaffPinGate from "@/components/StaffPinGate";
import StampScanner from "@/components/StampScanner";

export default function StaffPage() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg">
      {unlocked ? <StampScanner /> : <StaffPinGate onUnlock={() => setUnlocked(true)} />}
    </main>
  );
}
