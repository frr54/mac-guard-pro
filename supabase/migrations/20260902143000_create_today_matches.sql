create table if not exists public.today_matches (
  id uuid primary key default gen_random_uuid(),
  fixture_id integer not null unique,
  league_name text not null,
  home_team text not null,
  away_team text not null,
  home_logo text,
  away_logo text,
  match_time text not null,
  status text not null,
  score text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists today_matches_updated_at_idx
  on public.today_matches (updated_at desc);

alter table public.today_matches enable row level security;

create policy "Public can read today matches"
  on public.today_matches
  for select
  to anon, authenticated
  using (true);
