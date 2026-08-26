import { AdCreative } from "@/lib/ads.functions";

export interface AdSizePreset {
  id: string;
  label: string;
  width: number | null;
  height: number | null;
  category: "horizontal" | "rectangle" | "vertical" | "mobile" | "special";
  description: string;
}

export const AD_SIZE_PRESETS: AdSizePreset[] = [
  // Horizontal
  {
    id: "billboard",
    label: "Billboard",
    width: 970,
    height: 250,
    category: "horizontal",
    description: "970 × 250",
  },
  {
    id: "large-leaderboard",
    label: "Large Leaderboard",
    width: 970,
    height: 90,
    category: "horizontal",
    description: "970 × 90",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    width: 728,
    height: 90,
    category: "horizontal",
    description: "728 × 90",
  },

  // Rectangle
  {
    id: "large-rectangle",
    label: "Large Rectangle",
    width: 336,
    height: 280,
    category: "rectangle",
    description: "336 × 280",
  },
  {
    id: "medium-rectangle",
    label: "Medium Rectangle",
    width: 300,
    height: 250,
    category: "rectangle",
    description: "300 × 250",
  },

  // Vertical
  {
    id: "half-page",
    label: "Half Page",
    width: 300,
    height: 600,
    category: "vertical",
    description: "300 × 600",
  },
  {
    id: "wide-skyscraper",
    label: "Wide Skyscraper",
    width: 160,
    height: 600,
    category: "vertical",
    description: "160 × 600",
  },
  {
    id: "skyscraper",
    label: "Skyscraper",
    width: 120,
    height: 600,
    category: "vertical",
    description: "120 × 600",
  },

  // Mobile
  {
    id: "large-mobile-banner",
    label: "Large Mobile Banner",
    width: 320,
    height: 100,
    category: "mobile",
    description: "320 × 100",
  },
  {
    id: "mobile-banner",
    label: "Mobile Banner",
    width: 320,
    height: 50,
    category: "mobile",
    description: "320 × 50",
  },

  // Special
  {
    id: "responsive",
    label: "Responsive / Fluid",
    width: null,
    height: null,
    category: "special",
    description: "Flexible size",
  },
  {
    id: "custom",
    label: "Custom Size",
    width: null,
    height: null,
    category: "special",
    description: "Specify manually",
  },
];

export const detectImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error("Failed to load image for dimension detection"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const matchPreset = (width: number, height: number): AdSizePreset | null => {
  return AD_SIZE_PRESETS.find((p) => p.width === width && p.height === height) || null;
};
