import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { X } from "lucide-react";

/** Upload-only asset control (no URL pasting). */
export function AssetField({
  id,
  label,
  hint,
  requirements,
  value,
  onChange,
  folder,
  square = false,
  dark = false,
}: {
  id: string;
  label: string;
  hint?: string;
  requirements?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  square?: boolean;
  dark?: boolean;
}) {
  return (
    <div id={id} className="flex h-full flex-col gap-3 rounded-xl border border-border/70 p-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>

      <div
        className={`flex flex-1 items-center justify-center rounded-lg p-4 ${
          dark ? "bg-foreground/90" : "bg-muted/40"
        }`}
        aria-label={`${label} preview`}
      >
        <ImageUpload
          value={value}
          onChange={onChange}
          folder={folder}
          className={square ? "[&>div]:h-16 [&>div]:w-16" : "[&>div]:h-16 [&>div]:w-28"}
          rounded={square ? "rounded-lg" : "rounded-xl"}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        {requirements && (
          <p className="text-xs text-muted-foreground">{requirements}</p>
        )}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs text-muted-foreground"
            onClick={() => onChange(null)}
          >
            <X className="mr-1 h-3 w-3" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
