import { useState, useEffect, useRef, useMemo } from "react";
import { useActiveAds, useRecordAdEvent } from "@/lib/ads.functions";
import { cn } from "@/lib/utils";

interface SmartAdSlotProps {
  placement: string;
  tournamentId?: string;
  className?: string;
}

export function SmartAdSlot({ placement, tournamentId, className }: SmartAdSlotProps) {
  const { data: campaigns, isLoading } = useActiveAds(placement, tournamentId);
  const recordEvent = useRecordAdEvent();
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionRecorded = useRef(false);

  // ResizeObserver to detect container size
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Selection Logic
  const selectedCreative = useMemo(() => {
    if (!campaigns || campaigns.length === 0 || !containerSize) return null;

    // 1. Get all creatives from eligible campaigns
    const allCreatives = campaigns.flatMap(c => 
      c.ad_creatives.map(creative => ({ ...creative, priority: c.priority, weight: c.weight }))
    );

    // 2. Filter by size compatibility (creative must fit in container)
    const compatible = allCreatives.filter(c => {
      if (!c.width || !c.height) return true; // Responsive/Fluid
      return c.width <= containerSize.w;
    });

    if (compatible.length === 0) return null;

    // 3. Rank by priority
    const priorityMap = { guaranteed: 4, high: 3, normal: 2, low: 1 };
    compatible.sort((a, b) => {
      const pA = a.priority as keyof typeof priorityMap;
      const pB = b.priority as keyof typeof priorityMap;
      return (priorityMap[pB] || 0) - (priorityMap[pA] || 0);
    });

    const first = compatible[0];
    if (!first) return null;

    const highestPriority = first.priority;
    const topTier = compatible.filter(c => c.priority === highestPriority);

    // 4. Weighted selection within top tier
    const totalWeight = topTier.reduce((sum, c) => sum + (c.weight || 10), 0);
    let random = Math.random() * totalWeight;
    
    for (const creative of topTier) {
      random -= (creative.weight || 10);
      if (random <= 0) return creative;
    }

    return topTier[0];
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
              type: 'impression',
              page: window.location.pathname,
            });
            impressionRecorded.current = true;
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [selectedCreative, recordEvent, tournamentId]);

  const handleClick = () => {
    if (!selectedCreative) return;
    
    recordEvent.mutate({
      campaign_id: selectedCreative.campaign_id,
      creative_id: selectedCreative.id,
      tournament_id: tournamentId || null,
      type: 'click',
      page: window.location.pathname,
    });

    if (selectedCreative.destination_url) {
      window.open(selectedCreative.destination_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) return <div className={cn("w-full h-24 bg-secondary/20 animate-pulse rounded-lg", className)} />;
  if (!selectedCreative) return null;

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-lg transition-opacity duration-250 ease-transitions", className)}
      style={{ 
        aspectRatio: selectedCreative.width && selectedCreative.height 
          ? `${selectedCreative.width}/${selectedCreative.height}` 
          : 'auto',
        maxWidth: selectedCreative.width ? `${selectedCreative.width}px` : '100%',
        margin: '0 auto'
      }}
    >
      {selectedCreative.type === 'html' ? (
        <iframe
          srcDoc={selectedCreative.media_url}
          sandbox="allow-scripts"
          className="w-full h-full border-0"
          title={selectedCreative.name}
        />
      ) : (
        <button 
          onClick={handleClick}
          className="block w-full h-full p-0 border-0 bg-transparent cursor-pointer group"
        >
          <img
            src={selectedCreative.media_url}
            alt={selectedCreative.name}
            className="w-full h-full object-contain transition-transform duration-250 ease-transitions group-hover:scale-[1.02]"
            loading="lazy"
          />
        </button>
      )}
    </div>
  );
}
