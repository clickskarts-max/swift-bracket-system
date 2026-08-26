import { useState, useEffect, useRef } from "react";
import { useAdSettings, useActiveAds } from "@/lib/ads.functions";
import { SmartPlacementEngine, AdPageContext, AdRegionScore } from "@/lib/ads-engine";
import { SmartAdSlot } from "./smart-ad-slot";

interface AutoAdRegionProps {
  context: AdPageContext;
  tournamentId?: string;
  className?: string;
}

// Global counter for rendered ads on the current page session
let pageAdCount = 0;

export function AutoAdRegion({ context, tournamentId, className }: AutoAdRegionProps) {
  const { data: settings } = useAdSettings();
  const { data: campaigns } = useActiveAds("auto-placement", tournamentId, true);
  const [regionScore, setRegionScore] = useState<AdRegionScore | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Reset counter on mount (this is a simplified approach, usually we'd want a context provider)
  useEffect(() => {
    pageAdCount = 0;
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !settings || !campaigns) return;

    const width = containerRef.current.offsetWidth;
    setContainerWidth(width);

    const score = SmartPlacementEngine.evaluateRegion(
      context,
      width,
      settings,
      pageAdCount,
      document.body.scrollHeight,
      isMobile,
    );

    setRegionScore(score);

    // Only render if score is high enough (e.g., > 60)
    if (score.score > 60) {
      setShouldRender(true);
      pageAdCount++;
    }
  }, [context, settings, campaigns, isMobile]);

  // Debug overlay (only if ?ad_debug=true in URL)
  const isDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("ad_debug") === "true";

  return (
    <div ref={containerRef} className={className}>
      {shouldRender ? (
        <div className="relative group">
          <SmartAdSlot
            placement={`auto-${context}`}
            tournamentId={tournamentId || undefined}
            isAuto={true}
          />
          {isDebug && regionScore && (
            <div className="absolute inset-0 bg-green-500/20 border-2 border-green-500 pointer-events-none z-50 p-2 text-[10px] font-mono overflow-auto">
              <div className="bg-black/80 text-white p-1 rounded">
                <p className="font-bold">SMART AD: {regionScore.score}</p>
                <ul className="list-disc pl-3">
                  {regionScore.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        isDebug &&
        regionScore && (
          <div className="h-10 border-2 border-dashed border-gray-400 bg-gray-100/10 flex items-center justify-center text-[10px] font-mono text-muted-foreground overflow-hidden">
            BLOCKED: {regionScore.score} - {regionScore.reasons[0]}
          </div>
        )
      )}
    </div>
  );
}
