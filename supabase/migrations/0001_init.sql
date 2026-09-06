-- Autumn marketing dashboard — core schema
-- Facts only. Every dashboard metric is derived from these tables at query time.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- properties
create table if not exists public.properties (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  city        text not null,
  state       text,
  country     text not null default 'United States',
  timezone    text not null,
  room_count  integer check (room_count > 0),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- campaigns
create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  name          text not null,
  campaign_type text not null check (campaign_type in ('brand_protection','discovery','metasearch','retargeting')),
  status        text not null check (status in ('active','paused','ended')),
  started_at    date not null,
  ended_at      date,
  created_at    timestamptz not null default now(),
  constraint campaigns_dates_ok check (ended_at is null or ended_at >= started_at)
);

create index if not exists campaigns_property_idx on public.campaigns (property_id);

-- ------------------------------------------------- campaign_daily_metrics
-- One row per campaign per day. CTR and conversion are NOT stored; they are derived.
create table if not exists public.campaign_daily_metrics (
  id             bigint generated always as identity primary key,
  property_id    uuid not null references public.properties(id) on delete cascade,
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  metric_date    date not null,
  impressions    integer not null default 0 check (impressions >= 0),
  clicks         integer not null default 0 check (clicks >= 0),
  website_visits integer not null default 0 check (website_visits >= 0),
  ad_spend       numeric(12,2) not null default 0 check (ad_spend >= 0),
  created_at     timestamptz not null default now(),
  constraint cdm_funnel_ok check (impressions >= clicks and clicks >= website_visits),
  constraint cdm_unique_day unique (campaign_id, metric_date)
);

create index if not exists cdm_property_date_idx on public.campaign_daily_metrics (property_id, metric_date);
create index if not exists cdm_campaign_date_idx on public.campaign_daily_metrics (campaign_id, metric_date);

-- ---------------------------------------------------------------- bookings
-- Event level. Revenue is always SUM(booking_value) over these rows.
create table if not exists public.bookings (
  id                   uuid primary key default gen_random_uuid(),
  property_id          uuid not null references public.properties(id) on delete cascade,
  campaign_id          uuid references public.campaigns(id) on delete set null,
  booked_at            timestamptz not null,
  check_in             date not null,
  check_out            date not null,
  booking_value        numeric(12,2) not null check (booking_value > 0),
  room_nights          integer not null check (room_nights > 0),
  guest_city           text,
  guest_region         text,
  guest_country        text not null default 'United States',
  device               text check (device in ('mobile','desktop','tablet')),
  attributed_to_autumn boolean not null default true,
  attribution_type     text default 'last_touch',
  created_at           timestamptz not null default now(),
  constraint bookings_stay_ok check (check_out > check_in),
  constraint bookings_attribution_ok check (
    (attributed_to_autumn and campaign_id is not null) or (not attributed_to_autumn)
  )
);

create index if not exists bookings_property_booked_idx on public.bookings (property_id, booked_at);
create index if not exists bookings_campaign_idx on public.bookings (campaign_id);
create index if not exists bookings_city_idx on public.bookings (property_id, guest_city);

-- ----------------------------------------------------------- autumn_actions
create table if not exists public.autumn_actions (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  action_date date not null,
  action_type text not null,
  title       text not null,
  description text not null,
  status      text not null check (status in ('active','completed','monitoring')),
  created_at  timestamptz not null default now()
);

create index if not exists autumn_actions_property_date_idx on public.autumn_actions (property_id, action_date desc);

-- -------------------------------------------------------------------- RLS
-- Demo data only. Public read, no anonymous writes anywhere.
alter table public.properties            enable row level security;
alter table public.campaigns             enable row level security;
alter table public.campaign_daily_metrics enable row level security;
alter table public.bookings              enable row level security;
alter table public.autumn_actions        enable row level security;

drop policy if exists "demo read properties"  on public.properties;
drop policy if exists "demo read campaigns"   on public.campaigns;
drop policy if exists "demo read metrics"     on public.campaign_daily_metrics;
drop policy if exists "demo read bookings"    on public.bookings;
drop policy if exists "demo read actions"     on public.autumn_actions;

create policy "demo read properties" on public.properties             for select to anon, authenticated using (true);
create policy "demo read campaigns"  on public.campaigns              for select to anon, authenticated using (true);
create policy "demo read metrics"    on public.campaign_daily_metrics for select to anon, authenticated using (true);
create policy "demo read bookings"   on public.bookings               for select to anon, authenticated using (true);
create policy "demo read actions"    on public.autumn_actions         for select to anon, authenticated using (true);
