import { createFileRoute } from "@tanstack/react-router";

const API_URL = "https://v3.football.api-sports.io/fixtures";
const API_KEY = process.env.API_FOOTBALL_KEY || "1ebd525544fbeb7361f927576d3b5e6f";
const TIMEZONE = "America/Sao_Paulo";

type Fixture = {
  fixture?: { id?: number; date?: string; status?: { short?: string } };
  league?: { name?: string };
  teams?: {
    home?: { name?: string; logo?: string };
    away?: { name?: string; logo?: string };
  };
  goals?: { home?: number | null; away?: number | null };
};

function currentDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function mapFixture(item: Fixture) {
  const home = item.goals?.home;
  const away = item.goals?.away;

  return {
    fixture_id: item.fixture?.id ?? 0,
    league_name: item.league?.name ?? "",
    home_team: item.teams?.home?.name ?? "",
    away_team: item.teams?.away?.name ?? "",
    home_logo: item.teams?.home?.logo ?? "",
    away_logo: item.teams?.away?.logo ?? "",
    match_time: item.fixture?.date
      ? new Intl.DateTimeFormat("pt-BR", {
          timeZone: TIMEZONE,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date(item.fixture.date))
      : "",
    status: item.fixture?.status?.short ?? "NS",
    score: home != null && away != null ? `${home}-${away}` : "",
  };
}

async function fetchAndPersistDirectly() {
  const url = `${API_URL}?date=${currentDate()}&timezone=${TIMEZONE}`;
  const response = await fetch(url, {
    headers: { "x-apisports-key": API_KEY },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API-Football HTTP ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as { response?: Fixture[]; errors?: unknown };
  const matches = (payload.response ?? [])
    .map(mapFixture)
    .filter((match) => match.fixture_id > 0);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (matches.length > 0) {
    const { error } = await supabaseAdmin.from("today_matches").upsert(
      matches.map((match) => ({ ...match, updated_at: new Date().toISOString() })),
      { onConflict: "fixture_id" },
    );
    if (error) throw error;
  }

  return matches;
}

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
          try {
            const matches = await fetchAndPersistDirectly();
            return Response.json({
              status: "success",
              matches: matches.map((match) => ({
                fixture_id: match.fixture_id,
                league: match.league_name,
                home_team: match.home_team,
                away_team: match.away_team,
                home_logo: match.home_logo,
                away_logo: match.away_logo,
                match_time: match.match_time,
                status: match.status,
                score: match.score,
              })),
            });
          } catch (fallbackError) {
            console.error("[public/matches]", fallbackError);
            return Response.json(
              {
                status: "error",
                message: "Falha na sincronização",
                error_details:
                  fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
              },
              { status: 500 },
            );
          }
        }
      },
    },
  },
});
