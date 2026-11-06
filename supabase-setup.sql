-- Existing project migration for the Linktree link manager.
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 160),
  url text not null check (char_length(url) <= 2048),
  icon text not null default '↗' check (char_length(icon) <= 8),
  icon_source text not null default 'favicon'
    check (icon_source in ('favicon', 'instagram', 'youtube', 'tiktok', 'linkedin', 'github', 'email', 'globe', 'symbol', 'custom')),
  icon_url text not null default '' check (char_length(icon_url) <= 2048),
  icon_fit text not null default 'width' check (icon_fit in ('width', 'height')),
  icon_background text not null default '#f3ead8'
    check (icon_background ~ '^#[0-9A-Fa-f]{6}$'),
  group_name text not null default '' check (char_length(group_name) <= 60),
  is_social boolean not null default false,
  featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.links
  add column if not exists group_name text not null default ''
    check (char_length(group_name) <= 60),
  add column if not exists is_social boolean not null default false,
  add column if not exists icon_source text not null default 'symbol'
    check (icon_source in ('favicon', 'instagram', 'youtube', 'tiktok', 'linkedin', 'github', 'email', 'globe', 'symbol', 'custom')),
  add column if not exists icon_url text not null default ''
    check (char_length(icon_url) <= 2048),
  add column if not exists icon_fit text not null default 'width'
    check (icon_fit in ('width', 'height')),
  add column if not exists icon_background text not null default '#f3ead8'
    check (icon_background ~ '^#[0-9A-Fa-f]{6}$');

alter table public.links enable row level security;

grant select on public.links to anon, authenticated;
grant insert, update, delete on public.links to authenticated;

drop policy if exists "Anyone can read links" on public.links;
create policy "Anyone can read links"
  on public.links for select
  using (true);

drop policy if exists "Admin can add links" on public.links;
create policy "Admin can add links"
  on public.links for insert
  to authenticated
  with check (lower((select auth.jwt()) ->> 'email') = 'daffabagus41@gmail.com');

drop policy if exists "Admin can edit links" on public.links;
create policy "Admin can edit links"
  on public.links for update
  to authenticated
  using (lower((select auth.jwt()) ->> 'email') = 'daffabagus41@gmail.com')
  with check (lower((select auth.jwt()) ->> 'email') = 'daffabagus41@gmail.com');

drop policy if exists "Admin can delete links" on public.links;
create policy "Admin can delete links"
  on public.links for delete
  to authenticated
  using (lower((select auth.jwt()) ->> 'email') = 'daffabagus41@gmail.com');

create index if not exists links_position_created_at_idx
  on public.links (position, created_at);
