import { motion } from "framer-motion";
import { Check, ShieldCheck, Globe, Zap, Users, Smartphone, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LandingWorkflow() {
  return (
    <section className="py-32 bg-background border-t border-border/40 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="w-full md:w-1/3">
             <span className="text-primary font-black text-sm uppercase tracking-widest block mb-4 italic">01 Build</span>
             <h2 className="text-5xl md:text-7xl font-black font-display uppercase italic mb-8 leading-[0.9]">
               Setup Any <br /><span className="text-primary not-italic">Tournament</span>
             </h2>
             <p className="text-xl text-muted-foreground font-medium leading-relaxed mb-8">
               From professional leagues to multi-group knockouts, define every rule, team, and venue in minutes.
             </p>
             <ul className="space-y-4">
                {["Unlimited Teams", "Custom Rules", "Venue Management", "Multi-stage Formats"].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                    <Check className="h-4 w-4 text-primary" /> {item}
                  </li>
                ))}
             </ul>
          </div>
          <div className="w-full md:w-2/3">
             <div className="aspect-[16/10] bg-muted/10 rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden flex items-center justify-center">
                <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs italic opacity-40">Setup Wizard UI Showcase</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPoolDraw() {
  return (
    <section id="pool-draw" className="py-32 bg-card border-y border-border/40">
      <div className="container mx-auto px-6">
        <div className="flex flex-col-reverse md:flex-row gap-16 items-center">
          <div className="w-full md:w-2/3">
             <div className="aspect-[16/10] bg-muted/10 rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden flex items-center justify-center relative">
                <div className="h-64 w-64 rounded-full border-4 border-dashed border-primary/20 animate-spin-slow flex items-center justify-center">
                   <Zap className="h-20 w-20 text-primary/30" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                   <span className="text-xs font-black uppercase tracking-widest text-primary">Live Draw</span>
                </div>
             </div>
          </div>
          <div className="w-full md:w-1/3 text-right md:text-left">
             <span className="text-primary font-black text-sm uppercase tracking-widest block mb-4 italic">02 Run</span>
             <h2 className="text-5xl md:text-7xl font-black font-display uppercase italic mb-8 leading-[0.9]">
               Make the <br /><span className="text-primary not-italic">Draw An Event</span>
             </h2>
             <p className="text-xl text-muted-foreground font-medium leading-relaxed mb-8">
               Engage fans with our unique spin-the-wheel pool draw. Professional, transparent, and fair.
             </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingWhiteLabel() {
  return (
    <section id="white-label" className="py-32 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
           <span className="text-background font-black text-sm uppercase tracking-widest block mb-8 italic">03 Branding</span>
           <h2 className="text-6xl md:text-[100px] font-black font-display uppercase italic mb-12 leading-[0.85]">
             Your League. <br />Your Identity.
           </h2>
           <p className="text-2xl text-primary-foreground/90 font-medium leading-relaxed mb-16">
             A complete white-label system that disappears, letting your brand take the spotlight for teams and fans.
           </p>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {["Custom Domains", "Brand Colors", "Custom Logos", "Favicon Support"].map(item => (
                <div key={item} className="flex flex-col items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-background/20 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}

export function LandingSecurity() {
  return (
    <section id="security" className="py-32 bg-background">
      <div className="container mx-auto px-6">
         <div className="grid md:grid-cols-3 gap-12">
            <div>
               <h4 className="text-2xl font-black font-display uppercase italic mb-4">Secure & Scalable</h4>
               <p className="text-muted-foreground font-medium">Enterprise-grade security with strict RLS policies to ensure your league data is isolated and safe.</p>
            </div>
            <div>
               <h4 className="text-2xl font-black font-display uppercase italic mb-4">Mobile Sideline</h4>
               <p className="text-muted-foreground font-medium">Built for the game. Manage everything from a smartphone or tablet right from the coach's bench.</p>
            </div>
            <div>
               <h4 className="text-2xl font-black font-display uppercase italic mb-4">Real-time Stats</h4>
               <p className="text-muted-foreground font-medium">Instant updates for fans and spectators. Every bucket, every foul, reflected immediately across the platform.</p>
            </div>
         </div>
      </div>
    </section>
  );
}
