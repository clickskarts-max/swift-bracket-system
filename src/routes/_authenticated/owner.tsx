import { createFileRoute, redirect } from "@tanstack/react-router";
import { OwnerPanel } from "@/components/activation-gate";
import { OWNER_EMAIL } from "@/lib/activation";

export const Route = createFileRoute("/_authenticated/owner")({
  beforeLoad: ({ context }) => {
    if (context.user.email?.toLowerCase() !== OWNER_EMAIL) throw redirect({ to: "/dashboard" });
  },
  component: () => <OwnerPanel />,
});
