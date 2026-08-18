import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { TournamentForm } from "@/components/tournament-form";
import { useUpsert } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/tournaments/new")({
  head: () => ({
    meta: [
      { title: "New tournament — Ecluid Basketball" },
      {
        name: "description",
        content:
          "Set up a new basketball tournament: format, legs, playoffs, dates, venue and branding.",
      },
      { property: "og:title", content: "New tournament — Ecluid Basketball" },
      {
        property: "og:description",
        content: "Configure format, schedule and branding for your competition.",
      },
    ],
  }),
  component: NewTournament,
});

function NewTournament() {
  const navigate = useNavigate();
  const create = useUpsert("tournaments", [["tournaments"]]);

  return (
    <div>
      <PageHeader
        title="Create tournament"
        description="Choose a format now — you can regenerate the schedule anytime."
      />
      <TournamentForm
        submitLabel="Create tournament"
        pending={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (row) => {
              toast.success("Tournament created");
              const created = row as { id: string } | null;
              if (created?.id) navigate({ to: "/tournaments/$id", params: { id: created.id } });
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </div>
  );
}
