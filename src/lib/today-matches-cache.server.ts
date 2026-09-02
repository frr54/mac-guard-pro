import { supabaseAdmin } from "@/integrations/supabase/client.server";

const API_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env["API_FOOTBALL_KEY"];
const CACHE_TTL_MS = 20 * 60 * 1000;
const TIMEZONE = "America/Sao_Paulo";

type ApiFixture = {
  fixture?: { id?: number; date?: string; status?: { short?: string } };
  league?: { name?: string };
  teams?: {
    home?: { name?: string; logo?: string };
    away?: { name?: string; logo?: string };
  };
  goals?: { home?: number | null; away?: number | null };
};

type CachedMatch = {
  fixture_id: number;
  league_name: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  match_time: string;
  status: string;
  score: string;
};

function saoPauloDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatMatchTime(date?: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

function formatScore(goals?: ApiFixture["goals"]) {
  if (goals?.home == null || goals?.away == null) return "";
  return `${goals.home}-${goals.away}`;
}

async function fetchFixtures(): Promise<CachedMatch[]> {
  if (!API_KEY) throw new Error("Missing API_FOOTBALL_KEY environment variable");

  const url = new URL(`${API_URL}/fixtures`);
  url.searchParams.set("date", saoPauloDate());
  url.searchParams.set("timezone", TIMEZONE);

  const response = await fetch(url, {
    headers: { "x-apisports-key": API_KEY },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API-Football returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { response?: ApiFixture[]; errors?: unknown };
  return (payload.response ?? [])
    .filter((item) => Number.isInteger(item.fixture?.id))
    .map((item) => ({
      fixture_id: item.fixture!.id!,
      league_name: item.league?.name ?? "",
      home_team: item.teams?.home?.name ?? "",
      away_team: item.teams?.away?.name ?? "",
      home_logo: item.teams?.home?.logo ?? null,
      away_logo: item.teams?.away?.logo ?? null,
      match_time: formatMatchTime(item.fixture?.date),
      status: item.fixture?.status?.short ?? "NS",
      score: formatScore(item.goals),
    }));
}

export async function getTodayMatches() {
  const { data: latest, error: latestError } = await supabaseAdmin
    .from("today_matches")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw latestError;

  const fresh = latest?.updated_at && Date.now() - new Date(latest.updated_at).getTime() < CACHE_TTL_MS;

  if (!fresh) {
    const matches = await fetchFixtures();
    if (matches.length > 0) {
      const { error } = await supabaseAdmin.from("today_matches").upsert(
        matches.map((match) => ({ ...match, updated_at: new Date().toISOString() })),
        { onConflict: "fixture_id" },
      );
      if (error) throw error;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("today_matches")
    .select("fixture_id, league_name, home_team, away_team, home_logo, away_logo, match_time, status, score")
    .order("match_time", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
