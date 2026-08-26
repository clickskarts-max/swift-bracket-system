import { Globe } from "lucide-react";

export type BrandPreviewData = {
  displayName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primary: string;
  accent: string;
  footerText: string;
  poweredBy: boolean;
  showLogo: boolean;
  showName: boolean;
  showContact: boolean;
  contactEmail?: string;
  contactPhone?: string;
};

const HEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const safe = (v: string, fallback: string) => (HEX.test(v) ? v : fallback);

/** Miniature illustration of how branding appears on a public tournament page. */
export function BrandPreview({ data }: { data: BrandPreviewData }) {
  const primary = safe(data.primary, "#ff6b1a");
  const accent = safe(data.accent, "#3ba9ff");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Live preview</p>
        <span className="text-xs text-muted-foreground">Updates as you type</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* browser chrome + favicon */}
        <div className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <div className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-background px-2 py-1">
            {data.faviconUrl ? (
              <img
                src={data.faviconUrl}
                alt=""
                className="h-3.5 w-3.5 shrink-0 rounded-sm object-cover"
              />
            ) : (
              <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-[11px] text-muted-foreground">
              {data.displayName || "Your organization"}
            </span>
          </div>
        </div>

        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }}
        />

        <div className="space-y-4 p-4">
          <div className="flex min-w-0 items-center gap-3">
            {data.showLogo &&
              (data.logoUrl ? (
                <img
                  src={data.logoUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: primary }}
                >
                  {(data.displayName || "E").slice(0, 1).toUpperCase()}
                </div>
              ))}
            <div className="min-w-0">
              {data.showName && (
                <p className="truncate text-sm font-semibold">
                  {data.displayName || "Your organization"}
                </p>
              )}
              <p className="truncate text-xs text-muted-foreground">U-19 Girls Basketball League</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["Overview", "Fixtures", "Standings"].map((t, i) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={
                  i === 0
                    ? { backgroundColor: primary, color: "#fff" }
                    : { backgroundColor: `${accent}1a`, color: accent }
                }
              >
                {t}
              </span>
            ))}
          </div>

          <div className="rounded-xl border border-border/70">
            {[
              { team: "Team A", score: 72, win: true },
              { team: "Team B", score: 68, win: false },
            ].map((r) => (
              <div
                key={r.team}
                className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-xs last:border-b-0"
              >
                <span className={r.win ? "font-semibold" : "text-muted-foreground"}>{r.team}</span>
                <span
                  className="font-mono font-bold"
                  style={{ color: r.win ? primary : undefined }}
                >
                  {r.score}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-border/60 pt-3 text-center text-[11px] text-muted-foreground">
            <p className="truncate">
              {data.footerText ||
                `© ${new Date().getFullYear()} ${data.displayName || "Your organization"}`}
            </p>
            {data.showContact && (data.contactEmail || data.contactPhone) && (
              <p className="truncate">
                {[data.contactEmail, data.contactPhone].filter(Boolean).join(" · ")}
              </p>
            )}
            {data.poweredBy && <p className="italic opacity-70">Powered by Ecluid Basketball</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
