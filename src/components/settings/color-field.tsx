import { useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const HEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export function ColorField({
  id,
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  fallback: string;
  onChange: (next: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const valid = HEX.test(value);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={valid ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1"
        />
        <Input
          id={id}
          value={value}
          spellCheck={false}
          aria-invalid={!valid}
          aria-describedby={`${id}-msg`}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
        />
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(fallback)}
          aria-label={`Reset ${label} to default`}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <p
        id={`${id}-msg`}
        className={`text-xs ${valid ? "text-muted-foreground" : "text-destructive"}`}
        role={valid ? undefined : "alert"}
      >
        {valid ? hint ?? "Use a HEX value, for example #FF5A00." : `${label} must be a valid HEX color.`}
      </p>
    </div>
  );
}
