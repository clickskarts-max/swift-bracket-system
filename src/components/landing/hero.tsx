import { Link } from "@tanstack/react-router";
import { 
  Trophy, 
  ArrowRight, 
  LayoutGrid, 
  Users, 
  CalendarDays, 
  BarChart3, 
  MapPin, 
  Settings,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import DotField from "@/components/react-bits/DotField/DotField";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function LandingHero() {
  const { data: org } = useBranding();
  const { session } = useAuth();
  const primaryColor = org?.primary_color || "#ff6b1a";

  return (
    <section className="relative min-h-[70vh] flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <DotField
          dotRadius={1}
          dotSpacing={20}
          cursorRadius={500}
          bulgeStrength={60}
          gradientFrom={`${primaryColor}40`}
          gradientTo="transparent"
          glowColor={primaryColor}
        />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 mb-6 rounded-full border border-primary/20 bg-primary/5 text-primary text-[12px] font-bold uppercase tracking-widest"
          >
            {org?.brand_name || "BASKETBALL COMPETITION MANAGEMENT"}
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl md:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            Run Every Competition <br />
            <span className="text-primary">From One Command Center</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Create leagues, organize group stages, generate fixtures, manage venues, track standings and progress teams into knockout rounds — all from one connected platform.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Button size="lg" className="h-12 px-8 text-base font-semibold rounded-lg shadow-lg shadow-primary/10" asChild>
              <Link to={session ? "/dashboard" : "/auth"}>
                Create a Tournament
                <Trophy className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-12 px-8 text-base font-semibold rounded-lg" asChild>
              <a href="#features">
                Explore the Platform
              </a>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-xs font-medium text-muted-foreground/60 uppercase tracking-widest"
          >
            Built for organizers running serious basketball competitions.
          </motion.p>
        </div>

        {/* Platform Interface Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 max-w-6xl mx-auto relative group"
        >
          {/* Section Copy for Preview */}
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] block mb-3 uppercase">THE PLATFORM</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Your Entire Competition, In One View</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
              Fixtures, results, standings, teams, venues and tournament progression stay connected in one organized workspace.
            </p>
          </div>

          {/* Browser Frame */}
          <div className="rounded-2xl bg-card border border-border/50 p-1.5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden ring-1 ring-white/5">
            <div className="bg-background rounded-xl overflow-hidden border border-border/50 flex flex-col h-[640px]">
              {/* App Header/Toolbar */}
              <div className="h-12 border-b border-border/50 bg-secondary/30 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
                  </div>
                  <div className="h-4 w-px bg-border/30" />
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    <Trophy className="h-3 w-3 text-primary" />
                    <span>U-19 Girls Basketball League 2083</span>
                    <span className="px-1.5 py-0.5 rounded bg-success/10 text-success text-[9px] border border-success/20">Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-medium text-muted-foreground hidden sm:block">12 Teams · 3 Venues · League</div>
                  <Button size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider px-3 rounded-md">Manage</Button>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Mock */}
                <aside className="w-48 border-r border-border/50 bg-secondary/10 hidden md:flex flex-col p-3 shrink-0">
                  <div className="space-y-6">
                    <div>
                      <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 px-2">Tournament</div>
                      <div className="space-y-1">
                        {[
                          { label: 'Overview', icon: LayoutGrid },
                          { label: 'Teams', icon: Users },
                          { label: 'Fixtures', icon: CalendarDays },
                          { label: 'Standings', icon: BarChart3 },
                          { label: 'Venues', icon: MapPin }
                        ].map((item) => (
                          <div key={item.label} className={cn("px-2 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-2 transition-colors", item.label === 'Overview' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground cursor-pointer")}>
                            <item.icon className="h-3.5 w-3.5" />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 px-2">Competition</div>
                      <div className="space-y-1">
                        {['Group Stage', 'Knockout', 'Pool Draw'].map((item) => (
                          <div key={item} className="px-2 py-1.5 rounded-md text-[11px] font-semibold text-muted-foreground flex items-center gap-2 hover:bg-secondary/50 hover:text-foreground cursor-pointer">
                            <ArrowRight className="h-3 w-3 opacity-40" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-6 border-t border-border/20">
                    <div className="px-2 py-1.5 rounded-md text-[11px] font-semibold text-muted-foreground flex items-center gap-2 hover:bg-secondary/50 hover:text-foreground cursor-pointer">
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </div>
                  </div>
                </aside>

                {/* Content Area Mock */}
                <main className="flex-1 overflow-y-auto bg-card/5 p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-extrabold tracking-tight text-foreground">Competition Overview</h3>
                      <p className="text-xs text-muted-foreground font-medium">Track fixtures, standings and tournament progress from one place.</p>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-secondary/20 p-1 mb-6 border border-border/50 h-9">
                        <TabsTrigger value="overview" className="text-[10px] font-bold px-4 h-7">Overview</TabsTrigger>
                        <TabsTrigger value="fixtures" className="text-[10px] font-bold px-4 h-7">Fixtures</TabsTrigger>
                        <TabsTrigger value="standings" className="text-[10px] font-bold px-4 h-7">Standings</TabsTrigger>
                        <TabsTrigger value="knockout" className="text-[10px] font-bold px-4 h-7">Knockout</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Teams', value: '12' },
                            { label: 'Fixtures', value: '30' },
                            { label: 'Completed', value: '18' },
                            { label: 'Remaining', value: '12' },
                          ].map((stat) => (
                            <div key={stat.label} className="bg-background border border-border/50 rounded-xl p-3 shadow-sm ring-1 ring-white/5">
                              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</div>
                              <div className="text-xl font-black text-foreground tabular-nums">{stat.value}</div>
                            </div>
                          ))}
                        </div>

                        <div className="grid lg:grid-cols-[1fr_260px] gap-6">
                          <div className="space-y-6">
                            {/* Upcoming Fixtures Mock */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Upcoming Fixtures</h4>
                                <span className="text-[10px] font-bold text-primary cursor-pointer hover:underline">View Fixtures →</span>
                              </div>
                              {[
                                { a: 'Falcons', b: 'Warriors', time: 'Today · 4:00 PM', venue: 'National Sports Council Court' },
                                { a: 'Titans', b: 'Panthers', time: 'Today · 6:00 PM', venue: 'Court 2' },
                                { a: 'Lions', b: 'Hawks', time: 'Tomorrow · 2:00 PM', venue: 'Court 1' },
                              ].map((f, i) => (
                                <div key={i} className="bg-background border border-border/50 rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm ring-1 ring-white/5">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[8px] font-bold shrink-0">{f.a[0]}</div>
                                      <span className="text-xs font-bold truncate">{f.a}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-muted-foreground/30 italic shrink-0">VS</span>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded bg-secondary/20 border border-border/50 flex items-center justify-center text-[8px] font-bold shrink-0">{f.b[0]}</div>
                                      <span className="text-xs font-bold truncate">{f.b}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="text-[10px] font-bold text-foreground">{f.time}</div>
                                    <div className="text-[9px] text-muted-foreground font-medium truncate max-w-[120px]">{f.venue}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-6">
                            {/* Standings Summary */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">League Standings</h4>
                              <div className="bg-background border border-border/50 rounded-xl overflow-hidden shadow-sm ring-1 ring-white/5">
                                  <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-secondary/10">
                                          <th className="text-left p-2 font-black text-muted-foreground/60">POS</th>
                                          <th className="text-left p-2 font-black text-muted-foreground/60">TEAM</th>
                                          <th className="text-right p-2 font-black text-muted-foreground/60">PTS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {[
                                          { pos: 1, team: 'Falcons', pts: 11 },
                                          { pos: 2, team: 'Warriors', pts: 10 },
                                          { pos: 3, team: 'Titans', pts: 10 },
                                          { pos: 4, team: 'Panthers', pts: 9 },
                                        ].map((row) => (
                                          <tr key={row.pos} className="hover:bg-secondary/20 transition-colors">
                                              <td className="p-2 font-black text-primary tabular-nums">{row.pos}</td>
                                              <td className="p-2 font-bold">{row.team}</td>
                                              <td className="p-2 text-right font-black tabular-nums">{row.pts}</td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                  <div className="p-2 border-t border-border/50 bg-secondary/5 text-center">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-primary cursor-pointer hover:underline">Full Standings →</span>
                                  </div>
                              </div>
                            </div>

                            {/* Tournament Progress */}
                            <div className="bg-background border border-border/50 rounded-xl p-4 shadow-sm ring-1 ring-white/5">
                              <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Progress</h4>
                                  <span className="text-xs font-black text-primary tabular-nums">60%</span>
                              </div>
                              <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden mb-2">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '60%' }}
                                    transition={{ duration: 1, delay: 1 }}
                                    className="h-full bg-primary" 
                                  />
                              </div>
                              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">18 of 30 fixtures completed</div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="fixtures" className="mt-0 space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Match Management</h4>
                           <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest font-black">Generate Schedule</Button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                           {[
                              { a: 'Hawks', b: 'Lions', score: '72 - 68', status: 'Final' },
                              { a: 'Eagles', b: 'Wolves', score: '88 - 92', status: 'Final' },
                              { a: 'Tigers', b: 'Bears', score: '65 - 65', status: 'Live' },
                              { a: 'Sharks', b: 'Cobras', score: null, status: 'Upcoming' },
                           ].map((m, i) => (
                              <div key={i} className="bg-background border border-border/50 rounded-xl p-4 shadow-sm ring-1 ring-white/5 flex flex-col gap-3">
                                 <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                                    <span>Match #{100 + i}</span>
                                    <span className={cn("px-1.5 py-0.5 rounded", m.status === 'Live' ? "bg-success/10 text-success border border-success/20" : "bg-secondary/20 text-muted-foreground")}>{m.status}</span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold">{m.a}</span>
                                    <span className="text-sm font-black tabular-nums">{m.score || 'vs'}</span>
                                    <span className="text-xs font-bold">{m.b}</span>
                                 </div>
                                 <div className="flex gap-2 mt-1">
                                    <Button size="sm" variant="secondary" className="h-6 flex-1 text-[8px] uppercase tracking-widest font-black">Edit</Button>
                                    <Button size="sm" variant="outline" className="h-6 flex-1 text-[8px] uppercase tracking-widest font-black">Score</Button>
                                 </div>
                              </div>
                           ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="standings" className="mt-0 animate-in fade-in duration-500">
                         <div className="bg-background border border-border/50 rounded-xl overflow-hidden shadow-sm ring-1 ring-white/5">
                            <table className="w-full text-[11px]">
                               <thead>
                                  <tr className="border-b border-border/50 bg-secondary/10">
                                     <th className="text-left p-3 font-black text-muted-foreground/60">POS</th>
                                     <th className="text-left p-3 font-black text-muted-foreground/60">TEAM</th>
                                     <th className="text-center p-3 font-black text-muted-foreground/60">P</th>
                                     <th className="text-center p-3 font-black text-muted-foreground/60">W</th>
                                     <th className="text-center p-3 font-black text-muted-foreground/60">L</th>
                                     <th className="text-right p-3 font-black text-muted-foreground/60">PTS</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-border/30">
                                  {[
                                     { pos: 1, team: 'Falcons', p: 6, w: 5, l: 1, pts: 11 },
                                     { pos: 2, team: 'Warriors', p: 6, w: 4, l: 2, pts: 10 },
                                     { pos: 3, team: 'Titans', p: 6, w: 4, l: 2, pts: 10 },
                                     { pos: 4, team: 'Panthers', p: 6, w: 3, l: 3, pts: 9 },
                                     { pos: 5, team: 'Hawks', p: 6, w: 2, l: 4, pts: 8 },
                                     { pos: 6, team: 'Lions', p: 6, w: 2, l: 4, pts: 8 },
                                  ].map((row) => (
                                     <tr key={row.pos} className="hover:bg-secondary/20 transition-colors">
                                        <td className="p-3 font-black text-primary tabular-nums">{row.pos}</td>
                                        <td className="p-3 font-bold">{row.team}</td>
                                        <td className="p-3 text-center tabular-nums">{row.p}</td>
                                        <td className="p-3 text-center tabular-nums">{row.w}</td>
                                        <td className="p-3 text-center tabular-nums">{row.l}</td>
                                        <td className="p-3 text-right font-black tabular-nums">{row.pts}</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </TabsContent>

                      <TabsContent value="knockout" className="mt-0 animate-in fade-in duration-500">
                         <div className="flex flex-col items-center py-8">
                            <div className="flex gap-8">
                               {/* Semi-finals */}
                               <div className="flex flex-col justify-around gap-8">
                                  {[
                                     { a: 'Falcons', b: 'Panthers', scoreA: 78, scoreB: 71 },
                                     { a: 'Warriors', b: 'Titans', scoreA: 82, scoreB: 85 },
                                  ].map((m, i) => (
                                     <div key={i} className="bg-background border border-border/50 rounded-lg overflow-hidden shadow-sm w-40 divide-y divide-border/30">
                                        <div className="px-3 py-2 flex items-center justify-between">
                                           <span className={cn("text-xs font-bold", m.scoreA > m.scoreB && "text-primary")}>{m.a}</span>
                                           <span className="text-[11px] font-black tabular-nums">{m.scoreA}</span>
                                        </div>
                                        <div className="px-3 py-2 flex items-center justify-between">
                                           <span className={cn("text-xs font-bold", m.scoreB > m.scoreA && "text-primary")}>{m.b}</span>
                                           <span className="text-[11px] font-black tabular-nums">{m.scoreB}</span>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                               {/* Bracket Lines */}
                               <div className="flex flex-col justify-center gap-16">
                                  <div className="w-8 h-px bg-border/50" />
                                  <div className="w-8 h-px bg-border/50" />
                                </div>
                               {/* Final */}
                               <div className="flex flex-col justify-center">
                                  <div className="bg-primary/5 border border-primary/40 rounded-lg overflow-hidden shadow-lg w-40 divide-y divide-border/30 ring-1 ring-primary/20">
                                     <div className="bg-primary/10 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-primary text-center">Grand Final</div>
                                     <div className="px-3 py-2 flex items-center justify-between">
                                        <span className="text-xs font-bold">Falcons</span>
                                        <span className="text-[11px] font-black opacity-30">--</span>
                                     </div>
                                     <div className="px-3 py-2 flex items-center justify-between">
                                        <span className="text-xs font-bold">Titans</span>
                                        <span className="text-[11px] font-black opacity-30">--</span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </main>
              </div>
            </div>
              </div>
            </div>

            {/* Floating Interaction Element */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-3 rounded-xl shadow-2xl hidden xl:block ring-1 ring-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Match Updated</div>
                  <div className="text-[11px] font-bold opacity-90">Falcons 78–71 Warriors</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
