-- Conversion steps from components/track/Tracker.tsx (contact buttons, form start
-- and send, WhatsApp, email), and the optional phone on contact messages.
create table if not exists events (
  id         bigserial primary key,
  visitor    text not null,
  ref        text,
  name       text not null,
  path       text,
  country    text,
  created_at timestamptz not null default now()
);

create index if not exists events_created_idx on events (created_at desc);

alter table messages add column if not exists phone text;
