"use client";

import { useTranslations } from "next-intl";
import {
  LayoutGrid,
  Building2,
  Users,
  CalendarClock,
  BarChart3,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const columns = [
  {
    key: "stageWishlist",
    dot: "bg-slate-400",
    cards: [
      { name: "Vercel", role: "Frontend Eng." },
      { name: "Figma", role: "Design Systems" },
    ],
  },
  {
    key: "stageApplied",
    dot: "bg-brand-secondary",
    cards: [
      { name: "Stripe", role: "Product Eng." },
      { name: "Notion", role: "Full-stack" },
    ],
  },
  {
    key: "stageInterview",
    dot: "bg-brand-accent",
    cards: [{ name: "Linear", role: "Sr. Engineer" }],
  },
  {
    key: "stageOffer",
    dot: "bg-emerald-500",
    cards: [{ name: "Raycast", role: "Product Eng." }],
  },
] as const;

const tabs = [
  { key: "pipeline", icon: LayoutGrid, active: true },
  { key: "companies", icon: Building2, active: false },
  { key: "recruiters", icon: Users, active: false },
  { key: "interviews", icon: CalendarClock, active: false },
  { key: "analytics", icon: BarChart3, active: false },
] as const;

export function DashboardMockup() {
  const t = useTranslations("hero.mock");

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
      {/* Window bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-3 rounded-full bg-red-400/80" />
        <span className="size-3 rounded-full bg-amber-400/80" />
        <span className="size-3 rounded-full bg-emerald-400/80" />
        <span className="ms-3 text-xs font-medium text-muted-foreground">
          {t("appName")}
        </span>
      </div>

      <div className="flex">
        {/* Sidebar tabs */}
        <div className="hidden w-40 shrink-0 flex-col gap-1 border-e border-border p-3 sm:flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.key}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium",
                  tab.active
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {t(tab.key)}
              </div>
            );
          })}
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4">
          {/* Stat row */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Stat label={t("responseRate")} value="32%" accent />
            <Stat label={t("activeApps")} value="18" />
            <div className="rounded-xl border border-border bg-background-subtle p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <CalendarClock className="size-3" />
                {t("nextInterview")}
              </div>
              <div className="mt-1 truncate text-xs font-semibold">
                {t("tomorrow")}
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="grid grid-cols-4 gap-2">
            {columns.map((col) => (
              <div key={col.key} className="min-w-0">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", col.dot)} />
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(col.key)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.cards.map((card) => (
                    <div
                      key={card.name}
                      className="rounded-lg border border-border bg-background-subtle p-2.5"
                    >
                      <div className="text-xs font-semibold">{card.name}</div>
                      <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {card.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Reminder pill */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-brand" />
              <span className="text-xs font-medium">{t("followUp")}</span>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="size-3" />
              {t("due")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        accent
          ? "border-brand/20 bg-brand/5"
          : "border-border bg-background-subtle",
      )}
    >
      <div className="text-[10px] font-medium text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-bold",
          accent && "text-brand",
        )}
      >
        {value}
      </div>
    </div>
  );
}
