import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/matches")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { getTodayMatches } = await import("@/lib/today-matches-cache.server");
          const matches = await getTodayMatches();

          return Response.json({
            status: "success",
            matches: matches.map((match) => ({
              fixture_id: match.fixture_id,
              league: match.league_name,
              home_team: match.home_team,
              away_team: match.away_team,
              home_logo: match.home_logo ?? "",
              away_logo: match.away_logo ?? "",
              match_time: match.match_time,
              status: match.status,
              score: match.score,
            })),
          });
        } catch (error) {
          console.error("[public/matches]", error);
          return Response.json(
            { status: "error", matches: [], message: "Não foi possível carregar os jogos do dia" },
            { status: 500 },
          );
        }
      },
    },
  },
});
