-- What else a browser tells about a visit: language, screen, time zone, region,
-- and the campaign tag or ad click id it arrived with.
alter table visits
  add column if not exists lang   text,
  add column if not exists screen text,
  add column if not exists tz     text,
  add column if not exists region text,
  add column if not exists utm    text;
