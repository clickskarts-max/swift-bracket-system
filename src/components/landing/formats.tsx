import { Trophy, ArrowRight, Layout, Star, Zap, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LandingFormats() {
  const formats = [
    {
      title: "League",
      id: "01",
      desc: "Run complete seasonal competitions with automated standings and scheduling.",
      icon: Trophy,
      visual: "Standings UI"
    },
    {
      title: "League-cum-Knockout",
      id: "02",
      desc: "The tournament standard. Group stage qualifiers advancing to playoff brackets.",
      icon: Layout,
      visual: "Bracket UI"
    }
  ];

  return (
    <section id="formats" className="py-32 bg-card border-y border-border/40 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div className="max-w-2xl">
            <span className="text-primary font-black text-sm uppercase tracking-widest block mb-4 italic">Competition Formats</span>
            <h2 className="text-5xl md:text-8xl font-black font-display uppercase italic leading-[0.85]">
              Built for <br /><span className="text-primary not-italic">The Professional</span>
            </h2>
          </div>
          <div className="pb-4">
             <Button variant="outline" className="h-14 px-8 text-sm font-bold uppercase tracking-widest rounded-xl" asChild>
                <Link to="/auth">View All Formats <ArrowRight className="ml-2 h-4 w-4" /></Link>
             </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {formats.map((f, i) => (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group relative"
            >
              <div className="mb-8 flex items-baseline gap-4">
                <span className="text-4xl font-display font-black italic opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">{f.id}</span>
                <h3 className="text-4xl font-bold uppercase italic tracking-tighter">{f.title}</h3>
              </div>
              
              <div className="aspect-[16/9] bg-background/50 border border-border/50 rounded-[2.5rem] mb-8 overflow-hidden flex items-center justify-center group-hover:border-primary/30 transition-colors shadow-2xl">
                 <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-30 italic">{f.visual} Visual Artwork</span>
              </div>
              
              <p className="text-lg text-muted-foreground font-medium max-w-sm mb-6 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
