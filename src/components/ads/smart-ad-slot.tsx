import { useState, useEffect, useRef, useMemo } from "react";
import { useActiveAds, useRecordAdEvent } from "@/lib/ads.functions";
import { SmartPlacementEngine } from "@/lib/ads-engine";
import { cn } from "@/lib/utils";

interface SmartAdSlotProps {
  placement: string;
  tournamentId?: string | undefined;
  className?: string | undefined;
  isAuto?: boolean | undefined;
}

export function SmartAdSlot({
  placement,
  tournamentId,
  className,
  isAuto = false,
}: SmartAdSlotProps) {
  const { data: campaigns, isLoading } = useActiveAds(placement, tournamentId, isAuto);
  const recordEvent = useRecordAdEvent();
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionRecorded = useRef(false);

  // ResizeObserver to detect container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Measure immediately so selection can happen on first paint.
    setContainerSize({ w: el.offsetWidth, h: el.offsetHeight });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Selection Logic
  const selectedCreative = useMemo(() => {
    if (!campaigns || campaigns.length === 0 || !containerSize) return null;
    return SmartPlacementEngine.findCompatibleCreative(campaigns, containerSize.w);
  }, [campaigns, containerSize]);

  // Impression Tracking
  useEffect(() => {
    if (!selectedCreative || impressionRecorded.current) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Record after 1s visibility
          timer = setTimeout(() => {
            recordEvent.mutate({
              campaign_id: selectedCreative.campaign_id,
              creative_id: selectedCreative.id,
              placement_id: null,
              tournament_id: tournamentId || null,
              type: "impression",
              page: window.location.pathname,
            });
            impressionRecorded.current = true;
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
        }
      },
      { threshold: 0.5 },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [selectedCreative, recordEvent, tournamentId]);

  const handleClick = () => {
    if (!selectedCreative || selectedCreative.provider_type === "adsense") return;

    recordEvent.mutate({
      campaign_id: selectedCreative.campaign_id,
      creative_id: selectedCreative.id,
      tournament_id: tournamentId || null,
      type: "click",
      page: window.location.pathname,
    });

    if (selectedCreative.destination_url) {
      window.open(selectedCreative.destination_url, "_blank", "noopener,noreferrer");
    }
  };

  const ready = !isLoading && !!selectedCreative;

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ margin: "0 auto" }}
      aria-hidden={!ready}
    >
      {isLoading && !selectedCreative ? (
        <div className="h-24 w-full animate-pulse rounded-lg bg-secondary/20" />
      ) : !selectedCreative ? null : (
        <div
          className="relative mx-auto overflow-hidden rounded-lg transition-opacity duration-250 ease-transitions"
          style={{
            aspectRatio:
              selectedCreative.width && selectedCreative.height
                ? `${selectedCreative.width}/${selectedCreative.height}`
                : "auto",
            maxWidth: selectedCreative.width ? `${selectedCreative.width}px` : "100%",
          }}
        >
          {selectedCreative.provider_type === "adsense" ? (
            <div className="flex h-full w-full items-center justify-center bg-muted p-4 text-center text-xs text-muted-foreground">
              <div>
                <p className="font-semibold">Google AdSense</p>
                <p className="opacity-60">{selectedCreative.size_preset || "Responsive"}</p>
                <p className="mt-2 text-[10px] italic">AdSense will render here in production</p>
              </div>
            </div>
          ) : selectedCreative.type === "html" ? (
            <iframe
              srcDoc={selectedCreative.html_content || ""}
              sandbox="allow-scripts"
              className="h-full w-full border-0"
              title={selectedCreative.name}
            />
          ) : (
            <button
              onClick={handleClick}
              className="group block h-full w-full cursor-pointer border-0 bg-transparent p-0"
            >
              <img
                src={selectedCreative.media_url}
                alt={selectedCreative.alt_text || selectedCreative.name}
                className="h-full w-full object-contain transition-transform duration-250 ease-transitions group-hover:scale-[1.02]"
                loading="lazy"
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
