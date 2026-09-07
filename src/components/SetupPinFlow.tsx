"use client";

import { useState } from "react";
import ShopSetupForm from "@/components/ShopSetupForm";
import StaffPinGate from "@/components/StaffPinGate";

// The original /setup behavior, unchanged — every shop that hasn't linked
// an owner account (shop.ownerUserId unset) stays on this path forever.
export default function SetupPinFlow() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? <ShopSetupForm /> : <StaffPinGate onUnlock={() => setUnlocked(true)} />;
}
