-- SHAZ Gaming community comments — Postbase
-- Create this table in your Postbase project's SQL editor.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  name varchar(60) not null,
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_created_at_idx on comments(created_at desc);

-- Enable Row Level Security / policies using the Postbase dashboard.
-- Public visitors need SELECT + INSERT only. Do NOT expose a service-role key in the website.
