import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Trophy, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: org } = useBranding();
  const { session } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Formats", href: "#formats" },
    { name: "Pool Draw", href: "#pool-draw" },
    { name: "White Label", href: "#white-label" },
    { name: "Security", href: "#security" },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled 
          ? "bg-background/85 backdrop-blur-xl border-b border-border/40 py-3 shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <BrandWordmark />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => scrollToSection(e, link.href)}
              className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <Button variant="outline" className="font-bold uppercase tracking-widest rounded-xl" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="font-bold uppercase tracking-widest rounded-xl" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button className="font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-6 md:hidden animate-in slide-in-from-top-4 duration-300 ease-transitions">
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="text-lg font-bold uppercase tracking-widest text-foreground border-b border-border/40 pb-2"
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-4 pt-4">
              {session ? (
                <Button className="w-full font-bold uppercase tracking-widest rounded-xl" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full font-bold uppercase tracking-widest rounded-xl" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="w-full font-bold uppercase tracking-widest rounded-xl" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
