-- Personal link tracking: links handed out per recipient, and the page views they bring.
create table if not exists links (
  slug       text primary key,
  label      text not null,
  note       text,
  created_at timestamptz not null default now()
);

create table if not exists visits (
  id         uuid primary key,
  visitor    text not null,
  ref        text,
  path       text not null,
  referrer   text,
  country    text,
  city       text,
  device     text,
  browser    text,
  os         text,
  duration_s integer,
  created_at timestamptz not null default now()
);

create index if not exists visits_ref_idx on visits (ref, created_at desc);
create index if not exists visits_created_idx on visits (created_at desc);
