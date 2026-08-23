import { Trophy, Layout, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LandingFormats() {
  const formats = [
    {
      title: "League",
      desc: "Run a complete seasonal competition with fixtures, results, and automatic league table standings.",
      icon: Trophy,
      color: "text-blue-500",
      preview: "Standings Table"
    },
    {
      title: "League-cum-Knockout",
      desc: "The professional standard: Draw teams into groups, run group-stage standings, qualify top teams, and continue into the bracket playoffs.",
      icon: Layout,
      color: "text-orange-500",
      preview: "Bracket Visual"
    }
  ];

  return (
    <section id="formats" className="py-24 container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-black font-display uppercase italic mb-6">Built for the <span className="text-primary not-italic">Formats You Actually Use</span></h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {formats.map((f, i) => (
          <motion.div 
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="group p-10 rounded-[2.5rem] bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 ease-transitions shadow-sm hover:shadow-2xl hover:shadow-primary/10"
          >
            <f.icon className={cn("h-10 w-10 mb-6", f.color)} />
            <h3 className="text-2xl font-bold mb-4 uppercase italic">{f.title}</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">{f.desc}</p>
            
            <div className="h-48 rounded-xl bg-background/50 border border-border/40 flex items-center justify-center text-sm text-muted-foreground font-bold uppercase tracking-widest shadow-inner mb-6">
              {f.preview}
            </div>

            <Button variant="ghost" className="group-hover:text-primary transition-colors font-bold uppercase tracking-widest" asChild>
              <Link to="/auth">Configure Format <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

import { cn } from "@/lib/utils";
