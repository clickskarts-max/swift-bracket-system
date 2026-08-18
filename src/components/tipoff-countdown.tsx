import { useEffect, useMemo, useState } from "react";
import { formatDate, formatCountdownMs } from "@/lib/app";

export function TipoffCountdown({ scheduledAt }: { scheduledAt?: string | null }) {
  const target = useMemo(() => (scheduledAt ? new Date(scheduledAt) : null), [scheduledAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return <span>TBD</span>;
  const ms = target.getTime() - now;
  return (
    <span>
      {formatDate(scheduledAt)} · {formatCountdownMs(ms)}
    </span>
  );
}
