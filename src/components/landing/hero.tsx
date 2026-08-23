import { Link } from "@tanstack/react-router";
import { Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import DotField from "@/components/react-bits/DotField/DotField";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";

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
            className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6"
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

        {/* Product UI Composition */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 max-w-5xl mx-auto relative"
        >
          <div className="rounded-2xl bg-card border border-border/50 p-2 shadow-2xl">
             <div className="aspect-[16/8] bg-muted/10 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 opacity-40">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Platform Interface Preview</span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
