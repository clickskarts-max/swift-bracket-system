import { useEffect, useMemo, useState } from "react";
import { formatDate, formatCountdownMs } from "@/lib/app";

export function TipoffCountdown({
  scheduledAt,
  showDate = true,
}: {
  scheduledAt?: string | null;
  showDate?: boolean;
}) {
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
      {showDate ? `${formatDate(scheduledAt)} · ` : ""}
      {formatCountdownMs(ms)}
    </span>
  );
}
