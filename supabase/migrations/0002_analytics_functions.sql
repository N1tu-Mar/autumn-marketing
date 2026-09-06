-- Aggregation lives in the database so every screen reads the same numbers
-- from the same source of truth, and so no query is bounded by a row limit.
--
-- All functions are SECURITY INVOKER + STABLE: RLS still applies to the caller.
-- Booking date filtering uses booked_at converted into the property's timezone.

-- ------------------------------------------------------------------ overview
create or replace function public.overview_metrics(
  p_property uuid,
  p_from     date,
  p_to       date,
  p_tz       text default 'UTC'
)
returns table (
  impressions    bigint,
  clicks         bigint,
  website_visits bigint,
  ad_spend       numeric,
  bookings       bigint,
  booking_revenue numeric,
  room_nights    bigint
)
language sql
stable
as $$
  select
    coalesce(m.impressions, 0),
    coalesce(m.clicks, 0),
    coalesce(m.website_visits, 0),
    coalesce(m.ad_spend, 0),
    coalesce(b.bookings, 0),
    coalesce(b.booking_revenue, 0),
    coalesce(b.room_nights, 0)
  from
    (select sum(cdm.impressions)::bigint    as impressions,
            sum(cdm.clicks)::bigint         as clicks,
            sum(cdm.website_visits)::bigint as website_visits,
            sum(cdm.ad_spend)::numeric      as ad_spend
       from public.campaign_daily_metrics cdm
      where cdm.property_id = p_property
        and cdm.metric_date between p_from and p_to) m,
    (select count(*)::bigint             as bookings,
            sum(bk.booking_value)::numeric as booking_revenue,
            sum(bk.room_nights)::bigint    as room_nights
       from public.bookings bk
      where bk.property_id = p_property
        and bk.attributed_to_autumn
        and bk.booked_at >= (p_from::timestamp at time zone p_tz)
        and bk.booked_at <  ((p_to + 1)::timestamp at time zone p_tz)) b;
$$;

-- --------------------------------------------------------------------- trend
-- Zero-filled buckets so the chart never interpolates across a gap.
create or replace function public.performance_trend(
  p_property uuid,
  p_from     date,
  p_to       date,
  p_grain    text default 'day',
  p_tz       text default 'UTC'
)
returns table (
  bucket_start    date,
  booking_revenue numeric,
  bookings        bigint
)
language plpgsql
stable
as $$
begin
  if p_grain not in ('day', 'week', 'month') then
    raise exception 'invalid grain: %', p_grain;
  end if;

  return query
  with grid as (
    select generate_series(
             date_trunc(p_grain, p_from::timestamp),
             date_trunc(p_grain, p_to::timestamp),
             ('1 ' || p_grain)::interval
           )::date as b
  ),
  agg as (
    select date_trunc(p_grain, (bk.booked_at at time zone p_tz))::date as b,
           sum(bk.booking_value)::numeric as revenue,
           count(*)::bigint               as n
      from public.bookings bk
     where bk.property_id = p_property
       and bk.attributed_to_autumn
       and bk.booked_at >= (p_from::timestamp at time zone p_tz)
       and bk.booked_at <  ((p_to + 1)::timestamp at time zone p_tz)
     group by 1
  )
  select grid.b,
         coalesce(agg.revenue, 0)::numeric,
         coalesce(agg.n, 0)::bigint
    from grid
    left join agg on agg.b = grid.b
   order by grid.b;
end;
$$;

-- ---------------------------------------------------------- campaign rollup
create or replace function public.campaign_performance(
  p_property uuid,
  p_from     date,
  p_to       date,
  p_tz       text default 'UTC'
)
returns table (
  campaign_id     uuid,
  campaign_name   text,
  campaign_type   text,
  status          text,
  impressions     bigint,
  clicks          bigint,
  website_visits  bigint,
  ad_spend        numeric,
  bookings        bigint,
  booking_revenue numeric
)
language sql
stable
as $$
  select
    c.id,
    c.name,
    c.campaign_type,
    c.status,
    coalesce(m.impressions, 0)::bigint,
    coalesce(m.clicks, 0)::bigint,
    coalesce(m.website_visits, 0)::bigint,
    coalesce(m.ad_spend, 0)::numeric,
    coalesce(b.bookings, 0)::bigint,
    coalesce(b.booking_revenue, 0)::numeric
  from public.campaigns c
  left join lateral (
    select sum(cdm.impressions)    as impressions,
           sum(cdm.clicks)         as clicks,
           sum(cdm.website_visits) as website_visits,
           sum(cdm.ad_spend)       as ad_spend
      from public.campaign_daily_metrics cdm
     where cdm.campaign_id = c.id
       and cdm.metric_date between p_from and p_to
  ) m on true
  left join lateral (
    select count(*) as bookings, sum(bk.booking_value) as booking_revenue
      from public.bookings bk
     where bk.campaign_id = c.id
       and bk.attributed_to_autumn
       and bk.booked_at >= (p_from::timestamp at time zone p_tz)
       and bk.booked_at <  ((p_to + 1)::timestamp at time zone p_tz)
  ) b on true
  where c.property_id = p_property
  order by coalesce(b.booking_revenue, 0) desc, c.name;
$$;

-- --------------------------------------------------------------- feeder markets
create or replace function public.feeder_markets(
  p_property uuid,
  p_from     date,
  p_to       date,
  p_tz       text default 'UTC'
)
returns table (
  guest_city      text,
  guest_region    text,
  bookings        bigint,
  booking_revenue numeric,
  room_nights     bigint
)
language sql
stable
as $$
  select
    coalesce(bk.guest_city, 'Unknown'),
    max(bk.guest_region),
    count(*)::bigint,
    sum(bk.booking_value)::numeric,
    sum(bk.room_nights)::bigint
  from public.bookings bk
  where bk.property_id = p_property
    and bk.attributed_to_autumn
    and bk.booked_at >= (p_from::timestamp at time zone p_tz)
    and bk.booked_at <  ((p_to + 1)::timestamp at time zone p_tz)
  group by 1
  order by 4 desc;
$$;

-- --------------------------------------------------------- data freshness
create or replace function public.latest_data_date(p_property uuid)
returns date
language sql
stable
as $$
  select max(cdm.metric_date)
    from public.campaign_daily_metrics cdm
   where cdm.property_id = p_property;
$$;

grant execute on function public.overview_metrics(uuid, date, date, text)              to anon, authenticated;
grant execute on function public.performance_trend(uuid, date, date, text, text)       to anon, authenticated;
grant execute on function public.campaign_performance(uuid, date, date, text)          to anon, authenticated;
grant execute on function public.feeder_markets(uuid, date, date, text)                to anon, authenticated;
grant execute on function public.latest_data_date(uuid)                                to anon, authenticated;
