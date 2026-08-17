import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ListOrdered, Share2, Trophy, Upload, Users } from "lucide-react";
import heroCourt from "@/assets/hero-court.jpg";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ecluid Basketball — Basketball Tournament Management" },
      {
        name: "description",
        content:
          "Create leagues, group stages and knockout brackets, schedule matches, track live standings and publish shareable tournament pages.",
      },
      { property: "og:title", content: "Ecluid Basketball — Basketball Tournament Management" },
      {
        property: "og:description",
        content: "Fixtures, standings, brackets, teams and sponsors for basketball organizers.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Trophy, title: "Every format", body: "Single & double elimination, multi-leg round robin, league and group stage + knockout." },
  { icon: Upload, title: "Import fixtures", body: "Drop in a PDF or XML schedule — teams, rounds and match days are auto-detected." },
  { icon: CalendarDays, title: "Match day control", body: "Calendar or list scheduling with venues, courts, referees, live scores and home/away swap." },
  { icon: ListOrdered, title: "Instant standings", body: "Played, W-L, points for/against, difference and ranking recalculated as scores land." },
  { icon: Users, title: "Teams & rosters", body: "Team profiles, jersey colors, staff contacts, socials and full player statistics." },
  { icon: Share2, title: "Public pages", body: "Share /public/tournament/your-slug with fixtures, results, brackets, teams and sponsors." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <BrandWordmark />
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <section className="hero-surface court-texture relative overflow-hidden border-y border-border/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-rise">
            <p className="mb-3 inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
              Tournament operations
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              Run your basketball season <span className="text-gradient">like a pro league</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Ecluid Basketball turns fixtures, rosters, scores and sponsors into one live operating system — and publishes
              a beautiful public page for the fans.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="animate-pulse-ring">Start a tournament</Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">See what's inside</Button>
              </a>
            </div>
          </div>
          <div className="animate-fade relative">
            <img
              src={heroCourt}
              alt="Floodlit indoor basketball court before tip-off"
              width={1600}
              height={1008}
              className="w-full rounded-2xl border border-border object-cover shadow-[var(--shadow-glow)]"
            />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Built for the whole competition</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          From the draw to the trophy lift — schedule generation, live scoring, standings, brackets and sponsor placement.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card animate-rise p-5 transition-transform hover:-translate-y-1">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="surface-card hero-surface flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Tip-off is one click away</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Create your first tournament, add teams and let Ecluid generate the full fixture list.
          </p>
          <Link to="/auth">
            <Button size="lg">Create free account</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ecluid Basketball
      </footer>
    </div>
  );
}
