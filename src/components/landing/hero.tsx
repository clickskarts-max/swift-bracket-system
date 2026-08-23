import { Link } from "@tanstack/react-router";
import { Trophy, ArrowRight, Star, Zap, Users, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import DotField from "@/components/react-bits/DotField/DotField";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";

export function LandingHero() {
  const { data: org } = useBranding();
  const { session } = useAuth();
  const primaryColor = org?.primary_color || "#ff6b1a";

  return (
    <section className="relative min-h-[95vh] flex items-center pt-24 pb-12 overflow-hidden">
      {/* DotField Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <DotField
          dotRadius={1.2}
          dotSpacing={16}
          cursorRadius={400}
          cursorForce={0.08}
          bulgeStrength={50}
          gradientFrom={`${primaryColor}40`}
          gradientTo="transparent"
          glowColor={`${primaryColor}20`}
        />
      </div>

      <div className="container relative z-10 mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-left"
        >
          <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest animate-pulse">
            Basketball Tournament Management
          </Badge>
          
          <h1 className="font-display text-5xl md:text-8xl font-black tracking-tight leading-[1] mb-8 uppercase italic">
            Run Basketball <br />
            <span className="text-primary not-italic inline-block py-1">Tournaments</span> <br />
            Without the Chaos
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
            Create leagues, manage group stages, draw teams into pools, schedule fixtures, 
            track standings, publish results, and run knockout rounds from one powerful place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="h-16 px-12 text-lg font-bold rounded-2xl shadow-2xl shadow-primary/20 group relative overflow-hidden" asChild>
              <Link to={session ? "/dashboard" : "/auth"}>
                {session ? "Create Tournament" : "Get Started"}
                <Trophy className="ml-2 h-5 w-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-12 text-lg font-bold rounded-2xl bg-background/50 backdrop-blur-sm border-border/40 hover:bg-muted/50 transition-all shadow-lg" asChild>
              <a href="#features">
                Explore Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-6 grayscale opacity-60">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-bold uppercase tracking-widest">Built for Pro Leagues</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-bold uppercase tracking-widest">Real-time Stats</span>
            </div>
          </div>
        </motion.div>

        {/* Hero Visual Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 bg-background/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden p-8 aspect-[4/3.2] flex flex-col gap-8 transform lg:rotate-1">
            {/* Mock UI: Standings Card */}
            <div className="bg-background/80 border border-border/50 rounded-2xl p-4 shadow-lg animate-in slide-in-from-right-8 duration-700 ease-transitions">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-tighter text-primary">Live Standings</h4>
                <Badge variant="outline" className="text-[9px] h-4 bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold">{i}</div>
                      <div className="w-4 h-4 rounded-full bg-primary/20" />
                      <div className="h-2 w-20 bg-muted rounded-full" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-2 w-4 bg-primary/20 rounded-full" />
                      <div className="h-2 w-4 bg-muted rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock UI: Fixture Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-xl transform lg:-translate-x-12 translate-y-4 animate-in slide-in-from-left-8 duration-700 delay-300 ease-transitions">
              <div className="text-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Championship Finals</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shadow-md">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="h-2 w-12 bg-muted rounded-full" />
                </div>
                <div className="text-3xl font-display font-black italic">88 - 84</div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shadow-md">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div className="h-2 w-12 bg-muted rounded-full" />
                </div>
              </div>
            </div>

            {/* Mock UI: Group Pool Draw */}
            <div className="bg-background/80 border border-border/50 rounded-2xl p-4 shadow-lg transform lg:translate-x-8 lg:translate-y-8 animate-in slide-in-from-bottom-8 duration-700 delay-500 ease-transitions">
              <div className="flex items-center gap-2 mb-3">
                <ListOrdered className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-black uppercase tracking-tighter">Pool Draw Result</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/30 rounded-xl p-2 border border-border/20">
                  <span className="text-[10px] font-bold text-muted-foreground block mb-1">Group A</span>
                  <div className="h-1.5 w-full bg-primary/20 rounded-full mb-1" />
                  <div className="h-1.5 w-2/3 bg-muted rounded-full" />
                </div>
                <div className="bg-muted/30 rounded-xl p-2 border border-border/20">
                  <span className="text-[10px] font-bold text-muted-foreground block mb-1">Group B</span>
                  <div className="h-1.5 w-full bg-muted rounded-full mb-1" />
                  <div className="h-1.5 w-2/3 bg-primary/20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/5 rounded-full blur-[120px] -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
