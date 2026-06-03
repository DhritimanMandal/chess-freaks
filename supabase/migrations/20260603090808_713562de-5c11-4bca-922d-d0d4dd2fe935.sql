
-- Enums
create type public.app_role as enum ('admin', 'viewer');
create type public.tournament_format as enum ('round_robin', 'swiss', 'knockout', 'league');
create type public.tournament_status as enum ('draft', 'auction', 'ongoing', 'completed');
create type public.match_result as enum ('pending', 'team_a', 'team_b', 'draw');
create type public.auction_status as enum ('pending', 'live', 'completed');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can view their own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Auto-create profile and viewer role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'viewer');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  owner_name text,
  budget bigint not null default 100000000,
  points integer not null default 0,
  tournament_id uuid,
  created_at timestamptz not null default now()
);
grant select on public.teams to anon, authenticated;
grant all on public.teams to service_role;
alter table public.teams enable row level security;
create policy "Teams are viewable by everyone" on public.teams for select using (true);
create policy "Admins can insert teams" on public.teams for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update teams" on public.teams for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete teams" on public.teams for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Players
create table public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  country text,
  photo_url text,
  team_id uuid references public.teams(id) on delete set null,
  elo integer not null default 1500,
  mvp_count integer not null default 0,
  matches_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  auction_value bigint not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.players to anon, authenticated;
grant all on public.players to service_role;
alter table public.players enable row level security;
create policy "Players are viewable by everyone" on public.players for select using (true);
create policy "Admins can insert players" on public.players for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update players" on public.players for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete players" on public.players for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Tournaments
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  format tournament_format not null default 'round_robin',
  status tournament_status not null default 'draft',
  start_date date,
  end_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select on public.tournaments to anon, authenticated;
grant all on public.tournaments to service_role;
alter table public.tournaments enable row level security;
create policy "Tournaments are viewable by everyone" on public.tournaments for select using (true);
create policy "Admins can insert tournaments" on public.tournaments for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update tournaments" on public.tournaments for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete tournaments" on public.tournaments for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

alter table public.teams add constraint teams_tournament_fk foreign key (tournament_id) references public.tournaments(id) on delete set null;

-- Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  stage text,
  team_a_id uuid references public.teams(id) on delete set null,
  team_b_id uuid references public.teams(id) on delete set null,
  player_a_id uuid references public.players(id) on delete set null,
  player_b_id uuid references public.players(id) on delete set null,
  scheduled_at timestamptz,
  played_at timestamptz,
  result match_result not null default 'pending',
  mvp_player_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select on public.matches to anon, authenticated;
grant all on public.matches to service_role;
alter table public.matches enable row level security;
create policy "Matches are viewable by everyone" on public.matches for select using (true);
create policy "Admins can insert matches" on public.matches for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update matches" on public.matches for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete matches" on public.matches for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Auctions
create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  status auction_status not null default 'pending',
  current_player_id uuid references public.players(id) on delete set null,
  current_bid bigint not null default 0,
  current_team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select on public.auctions to anon, authenticated;
grant all on public.auctions to service_role;
alter table public.auctions enable row level security;
create policy "Auctions are viewable by everyone" on public.auctions for select using (true);
create policy "Admins can manage auctions" on public.auctions for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Bids
create table public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  amount bigint not null,
  created_at timestamptz not null default now()
);
grant select on public.bids to anon, authenticated;
grant all on public.bids to service_role;
alter table public.bids enable row level security;
create policy "Bids are viewable by everyone" on public.bids for select using (true);
create policy "Admins can manage bids" on public.bids for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Elo + stats update trigger on match result
create or replace function public.apply_match_result()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  k constant integer := 32;
  ra integer;
  rb integer;
  ea numeric;
  eb numeric;
  sa numeric;
  sb numeric;
  new_ra integer;
  new_rb integer;
begin
  -- Only act when result transitions from pending to a final state
  if new.result = 'pending' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.result = new.result then
    return new;
  end if;
  if new.player_a_id is null or new.player_b_id is null then
    return new;
  end if;

  select elo into ra from public.players where id = new.player_a_id;
  select elo into rb from public.players where id = new.player_b_id;
  if ra is null or rb is null then return new; end if;

  ea := 1.0 / (1.0 + power(10, (rb - ra) / 400.0));
  eb := 1.0 / (1.0 + power(10, (ra - rb) / 400.0));

  if new.result = 'team_a' then sa := 1; sb := 0;
  elsif new.result = 'team_b' then sa := 0; sb := 1;
  else sa := 0.5; sb := 0.5;
  end if;

  new_ra := round(ra + k * (sa - ea));
  new_rb := round(rb + k * (sb - eb));

  update public.players set
    elo = new_ra,
    matches_played = matches_played + 1,
    wins = wins + case when sa = 1 then 1 else 0 end,
    losses = losses + case when sa = 0 then 1 else 0 end,
    draws = draws + case when sa = 0.5 then 1 else 0 end
  where id = new.player_a_id;

  update public.players set
    elo = new_rb,
    matches_played = matches_played + 1,
    wins = wins + case when sb = 1 then 1 else 0 end,
    losses = losses + case when sb = 0 then 1 else 0 end,
    draws = draws + case when sb = 0.5 then 1 else 0 end
  where id = new.player_b_id;

  if new.mvp_player_id is not null then
    update public.players set mvp_count = mvp_count + 1 where id = new.mvp_player_id;
  end if;

  -- Team points: 3 win, 1 draw
  if new.result = 'team_a' and new.team_a_id is not null then
    update public.teams set points = points + 3 where id = new.team_a_id;
  elsif new.result = 'team_b' and new.team_b_id is not null then
    update public.teams set points = points + 3 where id = new.team_b_id;
  elsif new.result = 'draw' then
    if new.team_a_id is not null then update public.teams set points = points + 1 where id = new.team_a_id; end if;
    if new.team_b_id is not null then update public.teams set points = points + 1 where id = new.team_b_id; end if;
  end if;

  new.played_at := coalesce(new.played_at, now());
  return new;
end;
$$;

create trigger trg_apply_match_result
  before insert or update on public.matches
  for each row execute function public.apply_match_result();
