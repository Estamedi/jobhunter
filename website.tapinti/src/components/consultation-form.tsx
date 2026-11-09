"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "done" | "error" | "invalid";

const field =
  "mt-1.5 w-full rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-ring";

export function ConsultationForm() {
  const t = useTranslations("consultation");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.get("fullName"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
          website: data.get("website"),
          locale,
        }),
      });
      if (res.ok) {
        form.reset();
        setStatus("done");
      } else {
        setStatus(res.status === 400 ? "invalid" : "error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-brand/30 bg-card p-8 text-center"
      >
        <CheckCircle2 className="mx-auto size-10 text-brand" />
        <h2 className="mt-4 text-xl font-semibold">{t("successTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("successText")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <label className="block text-sm font-medium">
        {t("name")}
        <input
          name="fullName"
          required
          maxLength={200}
          autoComplete="name"
          className={field}
        />
      </label>
      <label className="block text-sm font-medium">
        {t("phone")}
        <input
          name="phone"
          type="tel"
          required
          maxLength={50}
          autoComplete="tel"
          dir="ltr"
          className={field}
        />
      </label>
      <label className="block text-sm font-medium">
        {t("email")}
        <input
          name="email"
          type="email"
          maxLength={256}
          autoComplete="email"
          dir="ltr"
          className={field}
        />
      </label>
      <label className="block text-sm font-medium">
        {t("message")}
        <textarea name="message" rows={4} maxLength={2000} className={field} />
      </label>

      {/* Honeypot: hidden from people, filled in by bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {(status === "error" || status === "invalid") && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {status === "invalid" ? t("invalid") : t("error")}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? t("sending") : t("submit")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("privacy")}</p>
    </form>
  );
}
