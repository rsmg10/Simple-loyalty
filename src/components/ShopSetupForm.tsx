"use client";

import { useState } from "react";
import ActivityLog from "./ActivityLog";
import CustomerList from "./CustomerList";
import CustomerLookup from "./CustomerLookup";
import { useI18n } from "./I18nProvider";
import ReminderLists from "./ReminderLists";
import SettingsForm from "./SettingsForm";
import StaffManager from "./StaffManager";
import StatsPanel from "./StatsPanel";
import TrendsChart from "./TrendsChart";

type Tab = "overview" | "customers" | "staff" | "settings";
const TABS: Tab[] = ["overview", "customers", "staff", "settings"];

// The owner's dashboard at /setup. Each tab mounts (and loads its data)
// only when opened.
export default function ShopSetupForm() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="w-full max-w-md space-y-lg">
      <div role="tablist" className="flex gap-xxs rounded-lg border border-hairline bg-canvas p-xxs">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={`h-10 min-w-0 flex-1 truncate rounded-md px-xs text-caption font-semibold ${
              tab === name ? "bg-primary text-on-primary" : "text-ink"
            }`}
          >
            {t.dashboard.tabs[name]}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <StatsPanel />
          <TrendsChart />
        </>
      )}
      {tab === "customers" && (
        <>
          <CustomerLookup />
          <ReminderLists />
          <CustomerList />
        </>
      )}
      {tab === "staff" && (
        <>
          <StaffManager />
          <ActivityLog />
        </>
      )}
      {tab === "settings" && <SettingsForm />}
    </div>
  );
}
