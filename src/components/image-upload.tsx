import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUpload({
  value,
  onChange,
  folder,
  bucket = "media",
  className,
  rounded = "rounded-xl",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  bucket?: string;
  className?: string;
  rounded?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sign in required");
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${uid}/${folder}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw new Error(up.error.message);
      const signed = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
      if (signed.error || !signed.data)
        throw new Error(signed.error?.message ?? "Could not create link");
      onChange(signed.data.signedUrl);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative group flex h-full w-full shrink-0 items-center justify-center overflow-hidden border border-border bg-muted/40 cursor-pointer hover:border-primary/40 transition-all duration-300 ease-transitions",
          rounded,
        )}
        onClick={() => inputRef.current?.click()}
      >
        <AnimatePresence mode="wait">
          {value ? (
            <motion.img 
              key="image"
              src={value} 
              alt="" 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full object-cover" 
            />
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <ImagePlus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 empty:hidden">
        {className?.includes("!gap-0") ? null : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
              )}
              {value ? "Replace" : "Upload"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <X className="mr-1.5 h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
        }}
      />
    </div>
  );
}
