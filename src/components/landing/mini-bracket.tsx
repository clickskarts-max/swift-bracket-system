import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Layout } from "lucide-react";

export function MiniBracket({ teams, tournament }: { teams: any[]; tournament: any }) {
  const [activeTab, setActiveTab] = useState("groups");

  const groups = useMemo(() => {
    // Deterministic split for demo
    const a = teams.slice(0, 4);
    const b = teams.slice(4, 8);
    return { A: a, B: b };
  }, [teams]);

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden text-[10px] animate-in fade-in duration-500">
      {/* App Header Mock */}
      <div className="border-b border-border/50 bg-secondary/10 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center shrink-0">
            <Layout className="h-2 w-2 text-primary" />
          </div>
          <span className="font-bold truncate">{tournament?.name || "League-cum-Knockout"}</span>
        </div>
        <Badge className="h-4 px-1.5 text-[8px] uppercase tracking-tighter bg-warning/10 text-warning border-warning/20">
          Stage 1
        </Badge>
      </div>

      <Tabs defaultValue="groups" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between bg-background shrink-0">
          <TabsList className="h-6 bg-secondary/20 p-0.5 border border-border/50">
            <TabsTrigger value="groups" className="text-[8px] font-bold px-3 h-5">Group Stage</TabsTrigger>
            <TabsTrigger value="knockout" className="text-[8px] font-bold px-3 h-5">Knockout</TabsTrigger>
          </TabsList>
          <span className="text-primary font-bold">Manage →</span>
        </div>

        <TabsContent value="groups" className="flex-1 overflow-auto p-3 m-0 space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
          {Object.entries(groups).map(([label, groupTeams]) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between border-b border-border/30 pb-1">
                <span className="font-black uppercase tracking-widest text-muted-foreground/60">Group {label}</span>
                <span className="text-[8px] text-muted-foreground/40">{groupTeams.length} Teams</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {groupTeams.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-1.5 p-1.5 rounded-lg border border-border/30 bg-secondary/5">
                    <div className="w-4 h-4 rounded-sm border border-border/50 flex items-center justify-center shrink-0 bg-white/5">
                      {t.logo_url ? (
                        <img src={t.logo_url} className="w-full h-full object-contain" alt="" />
                      ) : (
                        <Users className="h-2 w-2 text-muted-foreground/40" />
                      )}
                    </div>
                    <span className="font-bold truncate">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="knockout" className="flex-1 overflow-auto p-4 m-0 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="flex items-center justify-around h-full relative">
            {/* Semifinals */}
            <div className="flex flex-col justify-around h-full gap-4 z-10">
              {[0, 1].map(i => (
                <div key={i} className="w-24 bg-background border border-border/50 rounded-lg overflow-hidden shadow-sm ring-1 ring-white/5">
                  <div className="px-2 py-1.5 border-b border-border/30 flex justify-between items-center font-bold">
                    <span className="truncate">{teams[i*2]?.name || 'TBD'}</span>
                    <span className="text-primary tabular-nums">78</span>
                  </div>
                  <div className="px-2 py-1.5 flex justify-between items-center text-muted-foreground/60">
                    <span className="truncate">{teams[i*2 + 1]?.name || 'TBD'}</span>
                    <span className="tabular-nums">64</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full -z-0 pointer-events-none opacity-20">
               <path d="M 96 40 H 120 V 90 H 144" stroke="currentColor" fill="none" strokeWidth="1" />
               <path d="M 96 140 H 120 V 90 H 144" stroke="currentColor" fill="none" strokeWidth="1" />
            </svg>

            {/* Final */}
            <div className="flex flex-col justify-center h-full z-10">
              <div className="w-24 bg-background border border-primary/30 rounded-lg overflow-hidden shadow-glow ring-1 ring-primary/10">
                <div className="px-2 py-1 bg-primary/10 border-b border-primary/20 text-[7px] font-black uppercase tracking-widest text-primary text-center">
                  Final Match
                </div>
                <div className="px-2 py-1.5 border-b border-border/30 flex justify-between items-center font-bold text-primary">
                  <span className="truncate">{teams[0]?.name || 'TBD'}</span>
                  <span>—</span>
                </div>
                <div className="px-2 py-1.5 flex justify-between items-center font-bold">
                  <span className="truncate">{teams[2]?.name || 'TBD'}</span>
                  <span>—</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
