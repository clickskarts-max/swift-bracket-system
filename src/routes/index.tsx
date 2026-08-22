/**
 * Leia o arquivo instrucoes.md em anexo e siga as instruções contidas nele.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ListOrdered, Share2, Trophy, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand";
import DotField from "@/components/react-bits/DotField/DotField";
import { useBranding } from "@/hooks/use-branding";

function OrganizationFooter() {
  const { data: org } = useBranding();
  if (org) {
    return (
      <p className="text-sm text-muted-foreground font-medium">
        {org.footer_text || `© ${new Date().getFullYear()} ${org.brand_name || org.name}`}
        {org.powered_by_enabled !== false && (
          <span className="ml-2 opacity-50 block sm:inline">Powered by Ecluid Basketball</span>
        )}
      </p>
    );
  }
  return (
    <p className="text-sm text-muted-foreground font-medium">
      © {new Date().getFullYear()} Ecluid Basketball · The future of tournament management.
    </p>
  );
}


export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: org } = useBranding();
  
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <DotField
          speed={0.03}
          columnCount={15}
          direction="up"
          dotColor={org?.primary_color ? `${org.primary_color}26` : "rgba(255, 107, 26, 0.15)"}
        />
      </div>


      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-6 text-center">
        <div className="animate-in fade-in slide-in-from-top-8 duration-1000">
          <BrandWordmark />
          
          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent uppercase">
            Manage Your <br />
            <span className="text-primary italic">Basketball</span> Dynasty
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-medium">
            Professional league management, real-time standings, and dynamic knockout brackets. 
            Built for the modern game.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl group shadow-2xl shadow-primary/20" asChild>
              <Link to="/auth">
                Get Started 
                <Trophy className="ml-2 h-5 w-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold rounded-2xl border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10" asChild>
              <Link to="/auth">View Demo</Link>
            </Button>
          </div>
        </div>

        {/* Feature Grid Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {[
            { icon: ListOrdered, label: "Live Standings" },
            { icon: CalendarDays, label: "Smart Scheduling" },
            { icon: Users, label: "Team Hub" },
            { icon: Share2, label: "Public Pages" }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <feature.icon className="h-6 w-6 text-primary mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-white/5 text-center">
        <OrganizationFooter />
      </footer>
    </div>
  );
}
