import { useMemo } from "react";
import { computeStandings } from "@/lib/standings";
import { TeamChip } from "@/components/data-bits";
import { Badge } from "@/components/ui/badge";
import { Layout, Users, Trophy, FileText, BarChart3 } from "lucide-react";

export function MiniStandings({ teams, tournament }: { teams: any[]; tournament: any }) {
  const rows = useMemo(() => {
    return computeStandings(
      teams.map((t) => ({
        id: t.id,
        name: t.name,
        logo_url: t.logo_url,
        jersey_color: t.jersey_color,
      })),
      [], // No matches for demo standings, just show teams
      { format: tournament?.format || "league" },
    ).slice(0, 5); // Just top 5 for the mini view
  }, [teams, tournament]);

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden text-[10px] animate-in fade-in duration-500">
      {/* App Header Mock */}
      <div className="border-b border-border/50 bg-secondary/10 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center shrink-0">
            <Trophy className="h-2 w-2 text-primary" />
          </div>
          <span className="font-bold truncate">{tournament?.name || "League Overview"}</span>
        </div>
        <Badge className="h-4 px-1.5 text-[8px] uppercase tracking-tighter bg-success/10 text-success border-success/20">
          Active
        </Badge>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mock */}
        <div className="w-16 border-r border-border/50 bg-secondary/5 shrink-0 flex flex-col p-1 gap-1">
          {[Layout, Users, FileText, BarChart3].map((Icon, i) => (
            <div
              key={i}
              className={`h-5 w-full rounded flex items-center justify-center ${i === 3 ? "bg-primary/10 text-primary" : "text-muted-foreground/40"}`}
            >
              <Icon className="h-2.5 w-2.5" />
            </div>
          ))}
        </div>

        {/* Content Mock */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-border/50 bg-background flex items-center justify-between">
            <span className="font-black uppercase tracking-widest text-muted-foreground/60">
              Standings
            </span>
            <span className="text-primary font-bold">View Full →</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/5">
                  <th className="text-left px-3 py-1.5 font-black text-muted-foreground/40">POS</th>
                  <th className="text-left px-3 py-1.5 font-black text-muted-foreground/40">
                    TEAM
                  </th>
                  <th className="text-right px-3 py-1.5 font-black text-muted-foreground/40">
                    PTS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rows.map((r, i) => (
                  <tr key={r.team.id} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-3 py-1.5 font-black text-primary">{r.rank}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-4 h-4 rounded-sm border border-border/50 flex items-center justify-center shrink-0 bg-white/5">
                          {r.team.logo_url ? (
                            <img
                              src={r.team.logo_url}
                              className="w-full h-full object-contain"
                              alt=""
                            />
                          ) : (
                            <span className="text-[6px] font-bold text-muted-foreground/50">
                              {r.team.name[0]}
                            </span>
                          )}
                        </div>
                        <span className="font-bold truncate">{r.team.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right font-black tabular-nums">
                      {(5 - i) * 2}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
