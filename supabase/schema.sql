-- Wiki Streak — Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.

-- =========== profiles ===========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  daily_goal_min int not null default 5,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

-- auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========== reading_sessions ===========
create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_title text not null,
  article_pageid bigint,
  category text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  seconds_read int not null default 0,
  scroll_pct numeric(5,2) not null default 0,
  completed boolean not null default false,
  source text not null default 'streak' check (source in ('streak','commute'))
);
create index if not exists idx_sessions_user_started on public.reading_sessions(user_id, started_at desc);

-- =========== daily_streaks (materialized via trigger) ===========
create table if not exists public.daily_streaks (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  total_seconds int not null default 0,
  articles_count int not null default 0,
  hit_goal boolean not null default false,
  primary key (user_id, day)
);
create index if not exists idx_daily_user_day on public.daily_streaks(user_id, day desc);

create or replace function public.refresh_daily_streak()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tz text;
  v_goal int;
  v_day date;
  v_total int;
  v_count int;
begin
  select timezone, daily_goal_min into v_tz, v_goal from public.profiles where id = new.user_id;
  v_tz := coalesce(v_tz, 'UTC');
  v_goal := coalesce(v_goal, 5);
  v_day := (new.started_at at time zone v_tz)::date;

  select coalesce(sum(seconds_read),0), count(*)
    into v_total, v_count
    from public.reading_sessions
    where user_id = new.user_id
      and (started_at at time zone v_tz)::date = v_day;

  insert into public.daily_streaks (user_id, day, total_seconds, articles_count, hit_goal)
  values (new.user_id, v_day, v_total, v_count, v_total >= v_goal * 60)
  on conflict (user_id, day) do update
    set total_seconds = excluded.total_seconds,
        articles_count = excluded.articles_count,
        hit_goal = excluded.hit_goal;
  return new;
end;
$$;

drop trigger if exists on_session_change on public.reading_sessions;
create trigger on_session_change
  after insert or update of seconds_read on public.reading_sessions
  for each row execute function public.refresh_daily_streak();

-- =========== commute_runs ===========
create table if not exists public.commute_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  target_minutes int not null,
  category text,
  queue jsonb not null,
  completed_count int not null default 0
);
create index if not exists idx_commute_user_started on public.commute_runs(user_id, started_at desc);

-- =========== Row-Level Security ===========
alter table public.profiles         enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.daily_streaks    enable row level security;
alter table public.commute_runs     enable row level security;

create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "own sessions all" on public.reading_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own streaks read" on public.daily_streaks for select using (auth.uid() = user_id);

create policy "own commute all" on public.commute_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
