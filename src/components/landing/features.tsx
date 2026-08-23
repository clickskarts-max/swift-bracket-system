import { 
  Trophy, 
  Users, 
  CalendarDays, 
  ListOrdered, 
  Share2, 
  Settings, 
  RefreshCcw, 
  MapPin,
  Layout,
  ShieldCheck,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

export function LandingFeatures() {
  const features = [
    {
      title: "Tournament Creation",
      description: "Set up tournaments with teams, dates, formats, venues and custom rules in minutes.",
      icon: Trophy,
      size: "large"
    },
    {
      title: "Team Management",
      description: "Manage teams, logos, rosters and group assignments with ease.",
      icon: Users,
      size: "small"
    },
    {
      title: "Fixtures & Results",
      description: "Auto-generate schedules, assign venues and track live game scores.",
      icon: CalendarDays,
      size: "small"
    },
    {
      title: "Automatic Standings",
      description: "Real-time rankings based on wins, points, PF, PA and tie-break procedures.",
      icon: ListOrdered,
      size: "large"
    },
    {
      title: "Group Stage + Knockout",
      description: "Deterministic group qualification and automated bracket progression.",
      icon: Layout,
      size: "small"
    },
    {
      title: "Interactive Pool Draw",
      description: "The unique spin-the-wheel experience to assign teams to groups fairly.",
      icon: RefreshCcw,
      size: "small"
    },
    {
      title: "Venue Management",
      description: "Manage multiple courts and locations with intelligent fixture conflict detection.",
      icon: MapPin,
      size: "small"
    },
    {
      title: "White-Label Branding",
      description: "Customize everything to your brand: colors, logos, and custom domains.",
      icon: Settings,
      size: "small"
    }
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl md:text-5xl font-black font-display uppercase italic mb-6">
              Everything You Need to <span className="text-primary not-italic">Run the Game</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium">
              From the initial team registration to the championship buzzer, 
              we've automated the entire workflow.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "group relative p-8 rounded-3xl bg-background border border-border/40 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 ease-transitions",
                feature.size === "large" ? "lg:col-span-2" : ""
              )}
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Zap className="h-4 w-4 text-primary/40" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { cn } from "@/lib/utils";
