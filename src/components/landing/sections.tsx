import { motion } from "framer-motion";
import { RefreshCcw, Check, Zap, Users, ShieldCheck, Globe, Smartphone, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LandingWorkflow() {
  const steps = [
    { number: "01", title: "Setup", desc: "Define rules and dates" },
    { number: "02", title: "Teams", desc: "Manage rosters and logos" },
    { number: "03", title: "Draw", desc: "Randomize group pools" },
    { number: "04", title: "Schedule", desc: "Smart venue assignment" },
    { number: "05", title: "Score", desc: "Live match data entry" },
    { number: "06", title: "Rank", desc: "Automatic standings calculation" },
    { number: "07", title: "Bracket", desc: "Advance to knockout rounds" },
    { number: "08", title: "Final", desc: "Crown the championship winner" },
  ];

  return (
    <section className="py-24 bg-muted/20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black font-display uppercase italic mb-4">From Setup to <span className="text-primary not-italic">Champion</span></h2>
          <p className="text-muted-foreground font-medium">A connected workflow designed for professional organizers.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center text-center group"
            >
              <div className="h-12 w-12 rounded-full border-2 border-primary/20 bg-background flex items-center justify-center mb-4 group-hover:border-primary transition-all duration-300 ease-transitions z-10">
                <span className="text-sm font-black text-primary">{step.number}</span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-tight mb-1 italic">{step.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-tight px-2">{step.desc}</p>
              
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-[2px] bg-gradient-to-r from-primary/20 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPoolDraw() {
  return (
    <section id="pool-draw" className="py-24 container mx-auto px-6 border-y border-border/40">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest italic">Unique Feature</Badge>
          <h2 className="text-4xl md:text-5xl font-black font-display uppercase italic mb-6 leading-tight">
            Make the Group Draw <span className="text-primary not-italic">An Event</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
            Use the interactive Pool Draw to spin the wheel and assign teams into groups one by one. 
            Build hype for your tournament with a professional selection process.
          </p>
          
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Interactive Spin Wheel",
              "Balanced Group Capacity",
              "Manual & Auto Shuffle",
              "Real-time Visual Feedback",
              "Uneven Distribution Support",
              "Alpha-Numeric Grouping"
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground">
                <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="relative">
          <div className="aspect-square max-w-[450px] mx-auto bg-background rounded-full border-8 border-primary/10 shadow-2xl relative flex items-center justify-center p-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-6 h-6 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-primary" />
            <div className="w-full h-full rounded-full border-2 border-dashed border-primary/30 animate-spin-slow flex items-center justify-center">
               <RefreshCcw className="h-16 w-16 text-primary/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-tighter">Pool Draw</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 bg-background border border-border p-6 rounded-3xl shadow-2xl animate-bounce">
            <Users className="h-6 w-6 text-primary mb-2" />
            <div className="text-xs font-black uppercase tracking-tight">Team Assigned!</div>
            <div className="text-[10px] text-muted-foreground">Group B · Slot 3</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingWhiteLabel() {
  return (
    <section id="white-label" className="py-24 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative z-10 p-12 md:p-20">
          <h2 className="text-4xl md:text-5xl font-black font-display uppercase italic mb-6 leading-tight">
            Your League, <span className="text-background px-2 not-italic">Your Brand</span>
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed font-medium">
            Professional white-label system that puts your identity first. 
            Customize every touchpoint for teams and fans.
          </p>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-background/20 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-tight italic">Custom Domains</h4>
                <p className="text-sm text-primary-foreground/70">Host your tournament on your own URL.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-background/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-tight italic">Branded Dashboard</h4>
                <p className="text-sm text-primary-foreground/70">Custom colors, logos, and favicons.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="bg-background rounded-3xl p-4 shadow-2xl rotate-2">
            <div className="flex items-center justify-between mb-4 px-2 py-1 bg-muted/20 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </div>
              <div className="text-[10px] text-muted-foreground font-bold">your-league.com</div>
            </div>
            <div className="h-64 bg-muted/10 rounded-2xl flex flex-col items-center justify-center gap-4">
               <div className="h-12 w-32 bg-primary/20 rounded-lg animate-pulse" />
               <div className="grid grid-cols-2 gap-2 w-full px-8">
                  <div className="h-12 bg-muted/20 rounded-xl" />
                  <div className="h-12 bg-muted/20 rounded-xl" />
                  <div className="h-12 bg-muted/20 rounded-xl" />
                  <div className="h-12 bg-muted/20 rounded-xl" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingSecurity() {
  return (
    <section id="security" className="py-24 container mx-auto px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-8" />
        <h2 className="text-4xl font-black font-display uppercase italic mb-6">Built for <span className="text-primary not-italic">Reliability</span></h2>
        <p className="text-xl text-muted-foreground mb-16 font-medium">
          Trusted by organizers globally for data isolation, security, and fast updates during the biggest games.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-muted/30 border border-border/40">
             <Smartphone className="h-8 w-8 text-primary/60 mx-auto mb-4" />
             <h4 className="font-bold uppercase tracking-tight italic mb-2">Mobile Ready</h4>
             <p className="text-sm text-muted-foreground">Manage everything from the sideline on any device.</p>
          </div>
          <div className="p-8 rounded-3xl bg-muted/30 border border-border/40">
             <ShieldCheck className="h-8 w-8 text-primary/60 mx-auto mb-4" />
             <h4 className="font-bold uppercase tracking-tight italic mb-2">Data Isolation</h4>
             <p className="text-sm text-muted-foreground">Strict RLS policies ensure your data remains your own.</p>
          </div>
          <div className="p-8 rounded-3xl bg-muted/30 border border-border/40">
             <Zap className="h-8 w-8 text-primary/60 mx-auto mb-4" />
             <h4 className="font-bold uppercase tracking-tight italic mb-2">High Performance</h4>
             <p className="text-sm text-muted-foreground">Fast, real-time updates for fans and spectators.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
