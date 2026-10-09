-- Contact form messages. Kept even when the email fails, so none is ever lost;
-- ref/visitor tie a message to a personal link and its visits.
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  company    text,
  intent     text,
  message    text not null,
  locale     text,
  ref        text,
  visitor    text,
  network    text,
  city       text,
  country    text,
  device     text,
  emailed    boolean not null default false,
  mail_error text,
  created_at timestamptz not null default now()
);

create index if not exists messages_created_idx on messages (created_at desc);
