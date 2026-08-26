import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Users, Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export function MiniPoolDraw({ teams, tournament }: { teams: any[]; tournament: any }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [drawnTeams, setDrawnTeams] = useState<any[]>([]);
  const [lastDrawn, setLastDrawn] = useState<any | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoSpun = useRef(false);

  // Wheel teams: teams not yet "drawn" in the demo
  const wheelTeams = useMemo(() => {
    return teams.filter((t) => !drawnTeams.some((d) => d.id === t.id)).slice(0, 12);
  }, [teams, drawnTeams]);

  const spin = useCallback(() => {
    if (isSpinning || wheelTeams.length === 0) return;

    setIsSpinning(true);

    // Pick winner
    const winnerIdx = Math.floor(Math.random() * wheelTeams.length);
    const winner = wheelTeams[winnerIdx]!;

    const segmentDegree = 360 / wheelTeams.length;
    const targetDegree = 360 - winnerIdx * segmentDegree - segmentDegree / 2;
    // Add multiple rotations + the target alignment
    const totalRotation = rotation + 360 * 5 + targetDegree - (rotation % 360);

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setLastDrawn(winner);
      setDrawnTeams((prev) => [...prev, winner]);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#ff6b1a", "#ffffff"],
      });
    }, 3500);
  }, [isSpinning, wheelTeams, rotation]);

  // Visibility observer for auto-spin
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-spin once
  useEffect(() => {
    if (isVisible && !hasAutoSpun.current && !isSpinning && wheelTeams.length > 0) {
      hasAutoSpun.current = true;
      const timer = setTimeout(spin, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, isSpinning, wheelTeams.length, spin]);

  const groupLabels = ["A", "B", "C"];

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col md:flex-row gap-4 p-4 text-[10px]"
    >
      {/* Left: Wheel */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 relative min-h-[220px]">
        {/* Tournament Context */}
        <div className="absolute top-0 left-0 flex items-center gap-1.5 opacity-40">
          <Trophy className="h-2.5 w-2.5" />
          <span className="font-bold uppercase tracking-widest">
            {tournament?.name || "Tournament Draw"}
          </span>
        </div>

        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Pointer */}
          <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 z-20 w-4 h-4">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-primary" />
          </div>

          {/* Wheel SVG */}
          <motion.div
            animate={{ rotate: rotation }}
            transition={{
              duration: 3.5,
              ease: [0.12, 0, 0.39, 0],
            }}
            className="w-full h-full rounded-full border-4 border-primary/20 relative overflow-hidden bg-background shadow-xl"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {wheelTeams.map((team, i) => {
                const segmentAngle = 360 / wheelTeams.length;
                const startAngle = i * segmentAngle;
                const endAngle = (i + 1) * segmentAngle;

                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                const largeArc = segmentAngle > 180 ? 1 : 0;

                return (
                  <g key={team.id + i}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={i % 2 === 0 ? "rgba(255, 107, 26, 0.1)" : "rgba(255, 107, 26, 0.05)"}
                      stroke="rgba(255, 107, 26, 0.2)"
                      strokeWidth="0.2"
                    />
                    <text
                      x="70"
                      y="50"
                      transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`}
                      fontSize="2"
                      fontWeight="700"
                      textAnchor="middle"
                      fill="currentColor"
                      className="text-foreground/60"
                    >
                      {team.name.length > 10 ? team.name.substring(0, 8) + ".." : team.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* Center */}
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center z-10 shadow-inner">
            <Zap className={cn("h-3 w-3 text-primary", isSpinning && "animate-pulse")} />
          </div>
        </div>

        <Button
          size="sm"
          className="h-8 px-6 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg"
          disabled={isSpinning || wheelTeams.length === 0}
          onClick={spin}
        >
          {isSpinning ? "Drawing..." : "SPIN"}
        </Button>
      </div>

      {/* Right: Allocation */}
      <div className="w-full md:w-32 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-1.5 border-b border-border/50 pb-1 mb-1">
          <Users className="h-3 w-3 text-primary" />
          <span className="font-black uppercase tracking-widest text-muted-foreground/60">
            Draw Status
          </span>
        </div>

        <div className="space-y-2">
          {groupLabels.map((label, idx) => {
            const groupTeams = drawnTeams.filter((_, i) => i % 3 === idx);
            return (
              <div key={label} className="rounded-lg border border-border/50 bg-secondary/5 p-2">
                <div className="flex justify-between items-center mb-1 font-bold">
                  <span>Group {label}</span>
                  <span className="text-primary">{groupTeams.length}/4</span>
                </div>
                <div className="space-y-1">
                  {groupTeams.map((t, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={t.id + i}
                      className="flex items-center gap-1.5 truncate opacity-80"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                      <span className="truncate">{t.name}</span>
                    </motion.div>
                  ))}
                  {groupTeams.length === 0 && (
                    <div className="text-[8px] text-muted-foreground/30 italic">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {lastDrawn && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-auto p-2 rounded-lg border border-primary/20 bg-primary/5 flex items-center gap-2"
            >
              <div className="w-5 h-5 rounded bg-background border border-border/50 flex items-center justify-center shrink-0">
                {lastDrawn.logo_url ? (
                  <img src={lastDrawn.logo_url} className="w-full h-full object-contain" alt="" />
                ) : (
                  <Users className="h-2 w-2 text-muted-foreground/40" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[7px] font-black text-primary uppercase leading-none">
                  Last Drawn
                </div>
                <div className="font-bold truncate leading-tight">{lastDrawn.name}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
