import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { TournamentForm } from "@/components/tournament-form";
import { useUpsert, useTournament } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

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
        onSubmit={async (values) => {
          const { teams, venues, ...tournamentData } = values;
          create.mutate(tournamentData, {
            onSuccess: async (row) => {
              const created = row as { id: string } | null;
              if (created?.id) {
                const { data: userData } = await supabase.auth.getUser();
                const owner_id = userData.user?.id;

                if (owner_id) {
                  // Save teams
                  if (teams && teams.length > 0) {
                    const teamsWithIds = teams.map((t) => ({
                      tournament_id: created.id,
                      name: t.name,
                      logo_url: t.logo_url,
                      group_label: t.group_label,
                      owner_id,
                    }));

                    const { error: teamError } = await supabase.from("teams").insert(teamsWithIds);
                    if (teamError) {
                      toast.error("Tournament created but teams could not be saved: " + teamError.message);
                    }
                  }

                  // Save venues
                  if (venues && venues.length > 0) {
                    const venuesWithIds = venues.map((v) => ({
                      tournament_id: created.id,
                      name: v.name,
                      address: v.address,
                      google_maps_url: v.google_maps_url,
                      notes: v.notes,
                      owner_id,
                    }));

                    const { error: venueError } = await supabase.from("tournament_venues").insert(venuesWithIds);
                    if (venueError) {
                      toast.error("Tournament created but venues could not be saved: " + venueError.message);
                    }
                  }
                }
              }

              toast.success("Tournament created");
              if (created?.id) navigate({ to: "/tournaments/$id", params: { id: created.id } });
            },
            onError: (e) => toast.error(e.message),
          });
        }}
      />
    </div>
  );
}
