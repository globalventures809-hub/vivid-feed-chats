import { Check } from "lucide-react";

// Facebook-style verified blue checkmark. Server-managed boolean only.
export function VerifiedBadge({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      title="Verified"
      className={`inline-flex items-center justify-center rounded-full bg-[#1d9bf0] text-white align-middle ${className}`}
      style={{ width: size, height: size }}
      aria-label="Verified"
    >
      <Check style={{ width: size * 0.7, height: size * 0.7 }} strokeWidth={3} />
    </span>
  );
}
