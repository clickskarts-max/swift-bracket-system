import NepaliDatePkg from "nepali-date-converter";

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

export const uniqueSlug = (value: string) => `${slugify(value) || "tournament"}-${Math.random().toString(36).slice(2, 6)}`;

export const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
] as const;

export const MATCH_STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Final" },
  { value: "postponed", label: "Postponed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

export const SPONSOR_TIERS = ["title", "platinum", "gold", "silver", "bronze", "partner"] as const;

export const mapsUrl = (venue?: string | null) =>
  venue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}` : null;

const NepaliDate = ((NepaliDatePkg as unknown as { default?: unknown }).default ?? NepaliDatePkg) as any;
const pad2 = (n: number) => String(n).padStart(2, "0");
const bsFromAd = (d: Date) => {
  const bs = NepaliDate.fromAD(d);
  return `${bs.getYear()}-${pad2(bs.getMonth() + 1)}-${pad2(bs.getDate())}`;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "TBD";
  const d = new Date(value);
  const bs = bsFromAd(d);
  return `${bs}`;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "TBD";
  const d = new Date(value);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const bs = bsFromAd(d);
  return `${bs}\n\t${time}`;
};

export const formatDateRange = (start?: string | null, end?: string | null) => `${formatDate(start)}\n—\n${formatDate(end)}`;

export const formatDateRangeInline = (start?: string | null, end?: string | null) =>
  `${formatDate(start)} – ${formatDate(end)}`;

export const formatCountdownMs = (ms: number) => {
  if (Number.isNaN(ms)) return "TBD";
  if (ms <= 0) return "started";
  const totalSec = Math.floor(ms / 1000);
  if (totalSec <= 5) return "starting soon";
  const days = Math.floor(totalSec / (3600 * 24));
  const hours = Math.floor((totalSec - days * 3600 * 24) / 3600);
  const mins = Math.floor((totalSec - days * 3600 * 24 - hours * 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `in ${days}d ${hours}h ${mins}m ${secs}s`;
  if (hours > 0) return `in ${hours}h ${mins}m ${secs}s`;
  return `in ${mins}m ${secs}s`;
};

export const formatTipoffCountdown = (value?: string | null) => {
  if (!value) return "TBD";
  const d = new Date(value);
  const bs = bsFromAd(d);
  return `${bs} · ${formatCountdownMs(d.getTime() - Date.now())}`;
};

export const toLocalInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
