import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";

/** Upload-first asset control that still keeps the underlying URL editable. */
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
    <div className="space-y-2 rounded-xl border border-border/70 p-3">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>

      <div
        className={`rounded-lg p-2 ${dark ? "bg-foreground/90" : "bg-muted/40"}`}
        aria-label={`${label} preview`}
      >
        <ImageUpload
          value={value}
          onChange={onChange}
          folder={folder}
          className={square ? "!h-14 !w-14 [&>div]:h-14 [&>div]:w-14" : "[&>div]:h-14 [&>div]:w-24"}
          rounded={square ? "rounded-lg" : "rounded-xl"}
        />
      </div>

      <Input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="https://… (or upload above)"
        className="h-9 text-xs"
      />
      {requirements && <p className="text-xs text-muted-foreground">{requirements}</p>}
    </div>
  );
}
