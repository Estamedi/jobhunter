import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo-mark";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-6 w-auto shrink-0" />
      <span className="font-logo text-lg font-semibold uppercase tracking-[0.16em]">
        Tapinti
      </span>
    </span>
  );
}
