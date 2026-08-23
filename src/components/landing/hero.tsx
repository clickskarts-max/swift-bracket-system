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
    <section className="relative min-h-[90vh] flex items-center pt-32 pb-20 overflow-hidden">
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
            className="inline-block px-4 py-1.5 mb-8 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-[0.3em]"
          >
            {org?.brand_name || "Ecluid Basketball"}
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-6xl md:text-[120px] font-black tracking-tighter leading-[0.9] mb-12 uppercase italic"
          >
            Tournaments, <br />
            <span className="text-primary not-italic">Without the</span> <br />
            Chaos
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Button size="lg" className="h-16 px-12 text-lg font-bold rounded-2xl shadow-2xl shadow-primary/20" asChild>
              <Link to={session ? "/dashboard" : "/auth"}>
                Create Tournament
                <Trophy className="ml-3 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-16 px-12 text-lg font-bold rounded-2xl" asChild>
              <a href="#features">
                Explore Platform
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Product UI Composition */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 max-w-6xl mx-auto relative"
        >
          <div className="rounded-[3rem] bg-card/50 border border-white/10 p-4 shadow-[0_32px_96px_-24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
             <div className="aspect-[21/9] bg-muted/20 rounded-[2rem] overflow-hidden border border-border/50 flex items-center justify-center">
                <span className="text-muted-foreground font-bold uppercase tracking-widest text-sm italic opacity-50">Tournament Bracket UI Composition</span>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
