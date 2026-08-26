import { Trophy, ArrowRight, Layout, Star, Zap, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { usePublicTeams, useShowcaseTournament } from "@/lib/queries";
import { MiniStandings } from "./mini-standings";
import { MiniBracket } from "./mini-bracket";

export function LandingFormats() {
  const { data: tournament } = useShowcaseTournament();
  const { data: teams = [] } = usePublicTeams(tournament?.id ?? "");

  const formats = [
    {
      title: "League",
      id: "01",
      desc: "Run a complete league competition with scheduled fixtures, recorded results and automatically calculated standings.",
      icon: Trophy,
      visual: <MiniStandings teams={teams} tournament={tournament} />,
      cta: "Configure League",
    },
    {
      title: "Group Stage + Knockout",
      id: "02",
      desc: "Draw teams into groups, complete the group stage, qualify teams using configured rules and continue directly into knockout rounds.",
      icon: Layout,
      visual: <MiniBracket teams={teams} tournament={tournament} />,
      cta: "Configure Format",
    },
  ];

  return (
    <section id="formats" className="py-24 bg-card border-y border-border/10 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <h2 className="text-3xl md:text-[40px] font-extrabold mb-4">
            Built Around the Formats You Run
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Choose the competition structure, then manage the tournament from setup through the
            final result.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {formats.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group p-8 rounded-2xl border border-border/50 bg-background flex flex-col h-full hover:border-primary/20 transition-colors"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                  {f.id}
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed flex-grow">
                {f.desc}
              </p>

              <div className="aspect-video bg-muted/5 rounded-xl border border-border/50 mb-8 flex items-center justify-center overflow-hidden relative">
                {f.visual}
              </div>

              <Button
                variant="outline"
                className="h-10 px-6 text-xs font-bold uppercase tracking-widest rounded-lg w-full"
                asChild
              >
                <Link to="/auth">{f.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
