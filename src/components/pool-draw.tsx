import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  RefreshCcw, 
  Play, 
  X, 
  Check, 
  Users, 
  Zap, 
  ArrowRight,
  ChevronRight,
  ListOrdered
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { TeamValue } from "./tournament-form";
import { cn } from "@/lib/utils";

interface PoolDrawProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: TeamValue[];
  groupCount: number;
  teamsPerGroup: number;
  onApply: (teams: TeamValue[]) => void;
}

export function PoolDraw({ 
  open, 
  onOpenChange, 
  teams: initialTeams, 
  groupCount, 
  teamsPerGroup, 
  onApply 
}: PoolDrawProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnTeams, setDrawnTeams] = useState<TeamValue[]>([]);
  const [remainingTeams, setRemainingTeams] = useState<TeamValue[]>([]);
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [lastDrawn, setLastDrawn] = useState<{ team: TeamValue, group: string } | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Initialize: Locked teams (those already assigned) are excluded from the wheel
  useEffect(() => {
    if (open) {
      const assigned = initialTeams.filter(t => !!t.group_label);
      const unassigned = initialTeams.filter(t => !t.group_label);
      
      setDrawnTeams(assigned);
      setRemainingTeams(unassigned);
      
      // Determine next group to fill based on current counts
      const counts: Record<string, number> = {};
      assigned.forEach(t => {
        if (t.group_label) counts[t.group_label] = (counts[t.group_label] || 0) + 1;
      });

      // Find first group that isn't full
      let nextIdx = 0;
      for (let i = 0; i < groupCount; i++) {
        const label = String.fromCharCode(65 + i);
        if ((counts[label] || 0) < teamsPerGroup) {
          nextIdx = i;
          break;
        }
      }
      setCurrentGroupIdx(nextIdx);
      setLastDrawn(null);
      setIsSpinning(false);
    }
  }, [open, initialTeams, groupCount, teamsPerGroup]);

  const spin = useCallback(() => {
    if (isSpinning || remainingTeams.length === 0) return;

    setIsSpinning(true);
    
    // 1. Pick winner first
    const winnerIdx = Math.floor(Math.random() * remainingTeams.length);
    const winner = remainingTeams[winnerIdx]!;
    
    // 2. Calculate animation
    // Each segment is 360 / remainingTeams.length
    const segmentDegree = 360 / remainingTeams.length;
    // We want to land on the center of the segment
    // The wheel rotates clockwise, so we subtract the degree to find the point
    const targetDegree = 360 - (winnerIdx * segmentDegree) - (segmentDegree / 2);
    // Add multiple full rotations (5-8) for effect
    const totalRotation = rotation + (360 * 5) + targetDegree - (rotation % 360);
    
    setRotation(totalRotation);

    // 3. Wait for animation
    setTimeout(() => {
      setIsSpinning(false);
      const groupLabel = String.fromCharCode(65 + currentGroupIdx);
      
      const updatedWinner = { ...winner, group_label: groupLabel };
      setLastDrawn({ team: updatedWinner, group: groupLabel });
      
      setDrawnTeams(prev => [...prev, updatedWinner]);
      setRemainingTeams(prev => prev.filter((_, i) => i !== winnerIdx));
      
      // Rotate group index to next one that isn't full
      setDrawnTeams(currentDrawn => {
        const counts: Record<string, number> = {};
        [...currentDrawn, updatedWinner].forEach(t => {
          if (t.group_label) counts[t.group_label] = (counts[t.group_label] || 0) + 1;
        });

        let nextIdx = (currentGroupIdx + 1) % groupCount;
        for (let i = 0; i < groupCount; i++) {
          const idx = (nextIdx + i) % groupCount;
          const label = String.fromCharCode(65 + idx);
          if ((counts[label] || 0) < teamsPerGroup) {
            setCurrentGroupIdx(idx);
            break;
          }
        }
        return currentDrawn;
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b1a', '#ffffff', '#22c55e']
      });
    }, 3500);
  }, [isSpinning, remainingTeams, rotation, currentGroupIdx, groupCount, teamsPerGroup]);

  const handleApply = () => {
    onApply(drawnTeams);
    onOpenChange(false);
  };

  const currentGroupLabel = String.fromCharCode(65 + currentGroupIdx);

  return (
    <Dialog open={open} onOpenChange={(o) => !isSpinning && onOpenChange(o)}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-md">
        <DialogHeader className="px-6 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                Pool Draw
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Spin the wheel to assign teams to groups.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: The Wheel */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 border-r border-border/40 relative bg-muted/5">
            {remainingTeams.length > 0 ? (
              <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
                {/* Pointer */}
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 w-8 h-8 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary drop-shadow-md" />
                </div>

                {/* The Wheel */}
                <motion.div
                  animate={{ rotate: rotation }}
                  transition={{ 
                    duration: 3.5, 
                    ease: [0.12, 0, 0.39, 0], // Fast start, slow end
                  }}
                  className="w-full h-full rounded-full border-8 border-primary/20 shadow-2xl relative overflow-hidden bg-background"
                  style={{ transformOrigin: 'center' }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {remainingTeams.map((team, i) => {
                      const segmentAngle = 360 / remainingTeams.length;
                      const startAngle = i * segmentAngle;
                      const endAngle = (i + 1) * segmentAngle;
                      
                      // Convert to radians for SVG path
                      const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                      const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                      const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                      const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                      const largeArc = segmentAngle > 180 ? 1 : 0;
                      
                      return (
                        <g key={team.name + i}>
                          <path
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={i % 2 === 0 ? "rgba(255, 107, 26, 0.1)" : "rgba(255, 107, 26, 0.05)"}
                            stroke="rgba(255, 107, 26, 0.3)"
                            strokeWidth="0.5"
                          />
                          <text
                            x="75"
                            y="50"
                            transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`}
                            fontSize={remainingTeams.length > 12 ? "2" : "3"}
                            fontWeight="600"
                            textAnchor="middle"
                            fill="currentColor"
                            className="text-foreground"
                          >
                            {team.name.length > 15 ? team.name.substring(0, 12) + '...' : team.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>

                {/* Center circle */}
                <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-background border-4 border-primary/30 shadow-inner flex items-center justify-center z-10">
                   <Zap className={cn("h-6 w-6 text-primary", isSpinning && "animate-pulse")} />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary/20">
                  <Check className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display">Draw Complete!</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    All teams have been assigned to groups. Apply the results to continue.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-12 flex flex-col items-center gap-4 w-full">
              <AnimatePresence mode="wait">
                {lastDrawn && !isSpinning ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 shadow-glow"
                  >
                    <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {lastDrawn.team.logo_url ? (
                        <img src={lastDrawn.team.logo_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <Users className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-primary uppercase tracking-tighter">Just Drawn</div>
                      <div className="font-bold">{lastDrawn.team.name}</div>
                      <div className="text-xs text-muted-foreground">Assigned to Group {lastDrawn.group}</div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[74px]" />
                )}
              </AnimatePresence>

              {remainingTeams.length > 0 && (
                <div className="text-center space-y-4">
                   <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Targeting</span>
                    <div className="text-xl font-display font-bold px-4 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Group {currentGroupLabel}
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="h-14 px-10 text-lg font-bold shadow-xl animate-pulse-ring"
                    disabled={isSpinning}
                    onClick={spin}
                  >
                    {isSpinning ? (
                      <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-5 w-5 fill-current" />
                    )}
                    {isSpinning ? "Spinning..." : "Spin the Wheel"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Groups */}
          <div className="w-full md:w-[320px] bg-background flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 border-b border-border/40 bg-muted/30">
              <h3 className="font-bold flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-primary" />
                Live Draw Status
              </h3>
              <div className="mt-1 text-xs text-muted-foreground">
                {remainingTeams.length} teams remaining
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {Array.from({ length: groupCount }, (_, i) => {
                const label = String.fromCharCode(65 + i);
                const groupTeams = drawnTeams.filter(t => t.group_label === label);
                const isCurrent = currentGroupLabel === label && remainingTeams.length > 0;
                
                return (
                  <div 
                    key={label} 
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/60 bg-muted/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Group {label}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        groupTeams.length === teamsPerGroup ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                      )}>
                        {groupTeams.length} / {teamsPerGroup}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {groupTeams.map((team, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={team.name}
                          className="flex items-center gap-2 text-sm bg-background/50 p-1.5 rounded border border-border/40"
                        >
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                            {idx + 1}
                          </div>
                          <span className="truncate font-medium">{team.name}</span>
                        </motion.div>
                      ))}
                      {groupTeams.length === 0 && (
                        <div className="text-[10px] text-center py-2 text-muted-foreground italic">
                          Waiting for draw...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10 shrink-0 sm:justify-between items-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSpinning}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {remainingTeams.length === 0 && (
               <Button onClick={handleApply} className="font-bold">
                 Apply Draw <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

