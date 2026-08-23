import { motion } from "framer-motion";
import { Check, ShieldCheck, Globe, Zap, Users, Smartphone, Trophy, Layout, Settings, FileText, BarChart3, MapPin, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicTeams, useShowcaseTournament } from "@/lib/queries";
import { MiniPoolDraw } from "./mini-pool-draw";


export function LandingWorkflow() {
  const steps = [
    { id: "01", title: "Setup", desc: "Define competition rules and dates" },
    { id: "02", title: "Teams", desc: "Add teams, rosters and identities" },
    { id: "03", title: "Draw", desc: "Allocate teams into groups" },
    { id: "04", title: "Schedule", desc: "Build fixtures and assign venues" },
    { id: "05", title: "Results", desc: "Record scores and match outcomes" },
    { id: "06", title: "Standings", desc: "Calculate rankings automatically" },
    { id: "07", title: "Knockout", desc: "Progress qualified teams" },
    { id: "08", title: "Champion", desc: "Complete the final and crown the winner" },
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <h2 className="text-3xl md:text-[40px] font-extrabold mb-4">One Platform. Every Stage of Competition.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From registration and scheduling to standings and championship progression, Ecluid keeps every stage connected.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {[
            { title: "Tournament Setup", desc: "Configure teams, competition dates, venues, formats and tournament rules from one structured workspace.", icon: Settings },
            { title: "Team Management", desc: "Manage participating teams, logos, rosters and competition assignments without scattered spreadsheets.", icon: Users },
            { title: "Fixtures & Results", desc: "Generate schedules, assign venues and record results through a single competition workflow.", icon: FileText },
            { title: "Automatic Standings", desc: "Keep rankings updated automatically using wins, points, PF, PA and configured tie-break procedures.", icon: BarChart3 },
            { title: "Group Stage + Knockout", desc: "Run group-stage competition, determine qualifiers and move advancing teams into the knockout bracket.", icon: Layout },
            { title: "Interactive Pool Draw", desc: "Turn team allocation into a visible event with controlled, randomized group assignments.", icon: Zap },
            { title: "Venue Management", desc: "Coordinate multiple courts and locations while reducing scheduling conflicts.", icon: MapPin },
            { title: "Your Brand", desc: "Apply tournament colors, logos and identity across the competition experience.", icon: Palette },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-24 border-t border-border/10">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl md:text-[40px] font-extrabold mb-4">A Clear Path From Setup to Final</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every stage of the competition stays connected, so organizers always know what comes next.
            </p>
          </div>
          
          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-border/40 -z-10" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  <div className="h-20 w-20 rounded-2xl bg-background border border-border flex items-center justify-center mb-6 shadow-sm">
                    <span className="text-sm font-bold text-primary">{step.id}</span>
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-2">{step.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPoolDraw() {
  const { data: tournament } = useShowcaseTournament();
  const { data: teams = [] } = usePublicTeams(tournament?.id ?? "");

  return (
    <section id="pool-draw" className="py-24 bg-card border-y border-border/10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="w-full md:w-1/2">
             <div className="aspect-square max-w-md mx-auto bg-muted/5 rounded-2xl border border-border/50 shadow-2xl overflow-hidden flex items-center justify-center relative bg-background/50 backdrop-blur-sm">
                <MiniPoolDraw teams={teams} tournament={tournament} />
             </div>
          </div>

          <div className="w-full md:w-1/2">
             <span className="text-primary font-bold text-[12px] uppercase tracking-widest block mb-4">INTERACTIVE POOL DRAW</span>
             <h2 className="text-3xl md:text-[40px] font-extrabold mb-6">
               Turn the Group Draw Into Part of the Event
             </h2>
             <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
               Assign teams to groups with an interactive draw experience built for transparency, control and presentation.
             </p>
             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {[
                  "Interactive draw wheel",
                  "Balanced group capacity",
                  "Manual or randomized allocation",
                  "Real-time assignment feedback",
                  "Uneven team distribution support",
                  "Flexible group naming"
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm font-medium">
                    <Check className="h-4 w-4 text-primary shrink-0" /> {item}
                  </li>
                ))}
             </ul>
             <Button className="h-11 px-8 font-semibold uppercase tracking-widest rounded-lg" asChild>
                <a href="#pool-draw">Explore Pool Draw</a>
             </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingWhiteLabel() {
  return (
    <section id="white-label" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
           <h2 className="text-3xl md:text-[40px] font-extrabold mb-6">
             Your Competition. Your Identity.
           </h2>
           <p className="text-lg text-muted-foreground leading-relaxed">
             Create a tournament experience that looks like your organization — not someone else's software.
           </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { title: "Custom Branding", desc: "Apply logos, colors and competition identity.", icon: Palette },
             { title: "Branded Experience", desc: "Keep tournament-facing screens consistent with your organization.", icon: Globe },
             { title: "Custom Domain", desc: "Present competitions through your own web address when configured.", icon: ShieldCheck },
           ].map(item => (
             <div key={item.title} className="p-8 rounded-xl border border-border/50 bg-card text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center mb-6">
                   <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </section>
  );
}

export function LandingSecurity() {
  return (
    <section id="security" className="py-24 bg-card border-t border-border/10">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <h2 className="text-3xl md:text-[40px] font-extrabold mb-4">Built for Match Day</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fixtures, results, standings, teams, venues and tournament progression stay connected in one organized workspace.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-4">
            Built to give organizers a clear view of what has happened, what is live and what comes next.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           {[
             { title: "Mobile Ready", desc: "Manage competition activity from phones, tablets or desktops.", icon: Smartphone },
             { title: "Protected Tournament Data", desc: "Keep tournament information separated and securely controlled.", icon: ShieldCheck },
             { title: "Real-Time Updates", desc: "Publish scores, standings and competition changes without unnecessary delays.", icon: Zap },
           ].map(item => (
             <div key={item.title} className="p-8 rounded-xl border border-border/50 bg-background group hover:border-primary/20 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                   <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </section>
  );
}
