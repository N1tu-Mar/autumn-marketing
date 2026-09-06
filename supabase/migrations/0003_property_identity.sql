-- Property identity for the dashboard header.
--
-- The dashboard should feel aware of the specific hotel, so the presentation
-- fields live on the property row rather than in a component. Both are
-- nullable: the UI falls back to a monogram drawn from the property name.

alter table public.properties
  add column if not exists image_url  text,
  add column if not exists short_name text;

update public.properties
   set short_name = 'Harborlight'
 where slug = 'harborlight-inn'
   and short_name is null;
