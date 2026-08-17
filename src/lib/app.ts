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

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "TBD";

export const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "TBD";

export const toLocalInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
