-- Richer visits and events (components/track/Tracker.tsx). What a browser openly
-- exposes about its window, device class, connection and load speed; the approximate
-- (city-level) Vercel geo; the visitor's session number and how far the page was
-- scrolled. Events get a small JSON payload (scroll depth, link host, field name).
-- No raw IP and no fingerprinting: the network stays the salted hash from 002.
alter table visits
  add column if not exists viewport       text,
  add column if not exists dpr            real,
  add column if not exists scheme         text,
  add column if not exists reduced_motion boolean,
  add column if not exists pointer        text,
  add column if not exists connection     text,
  add column if not exists memory_gb      real,
  add column if not exists cores          integer,
  add column if not exists ttfb_ms        integer,
  add column if not exists dom_ms         integer,
  add column if not exists lcp_ms         integer,
  add column if not exists session_n      integer,
  add column if not exists scroll_pct     integer,
  add column if not exists latitude       real,
  add column if not exists longitude      real,
  add column if not exists postal         text;

alter table events add column if not exists data jsonb;

create index if not exists visits_visitor_idx on visits (visitor, created_at);
create index if not exists events_visitor_idx on events (visitor, created_at);
