-- Run this entire file in your Supabase project → SQL Editor → New Query → Run

-- ── Cakes ───────────────────────────────────────────────────
create table if not exists cakes (
  id              uuid default gen_random_uuid() primary key,
  title           text not null,
  price           numeric(10,2) not null default 0,
  deposit_percent integer not null default 30,
  description     text,
  category        text,
  servings        text,
  image_url       text,
  gallery         text[] default '{}',
  allergens       text[] default '{}',
  body            text,
  available       boolean default true,
  featured        boolean default false,
  created_at      timestamptz default now()
);

-- ── Blog Posts ───────────────────────────────────────────────
create table if not exists blog_posts (
  id                  uuid default gen_random_uuid() primary key,
  title               text not null,
  date                date default current_date,
  excerpt             text,
  image_url           text,
  video_url           text,
  external_video_url  text,
  pdf_url             text,
  tags                text[] default '{}',
  body                text,
  created_at          timestamptz default now()
);

-- ── Settings ─────────────────────────────────────────────────
create table if not exists settings (
  key   text primary key,
  value jsonb
);

-- ── Availability ─────────────────────────────────────────────
create table if not exists availability (
  id      uuid default gen_random_uuid() primary key,
  date    date not null unique,
  slots   text[] default '{}',
  booked  boolean default false
);

-- ── Storage bucket for images ─────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('images', 'images', true)
  on conflict (id) do nothing;

-- ── Row Level Security (RLS) ──────────────────────────────────
-- Public can READ everything
alter table cakes enable row level security;
alter table blog_posts enable row level security;
alter table settings enable row level security;
alter table availability enable row level security;

create policy "Public read cakes"        on cakes        for select using (true);
create policy "Public read blog_posts"   on blog_posts   for select using (true);
create policy "Public read settings"     on settings     for select using (true);
create policy "Public read availability" on availability for select using (true);

-- Only authenticated users (Pam) can write
create policy "Auth write cakes"        on cakes        for all using (auth.role() = 'authenticated');
create policy "Auth write blog_posts"   on blog_posts   for all using (auth.role() = 'authenticated');
create policy "Auth write settings"     on settings     for all using (auth.role() = 'authenticated');
create policy "Auth write availability" on availability for all using (auth.role() = 'authenticated');

-- Storage: public read, auth write
create policy "Public read images"
  on storage.objects for select using (bucket_id = 'images');
create policy "Auth upload images"
  on storage.objects for insert with check (bucket_id = 'images' and auth.role() = 'authenticated');
create policy "Auth delete images"
  on storage.objects for delete using (bucket_id = 'images' and auth.role() = 'authenticated');

-- ── Seed homepage settings ────────────────────────────────────
insert into settings (key, value) values
  ('homepage', '{"bakeryName":"Pam''s Cooking for Real Life","tagline":"Handcrafted cakes for life''s sweetest moments","aboutStory":"Every cake I make starts with a conversation. I want to understand your story — the love you''re celebrating, the memory you''re creating. Then I bake it in.\n\nI''ve been baking for over a decade, and every cake is made entirely by hand, to order. No shortcuts. No prefab layers. Just real ingredients and a lot of heart.","phone":"","email":"","instagram":""}'),
  ('payments',  '{"method":"PayPal","payment_id":"","custom_instructions":""}')
on conflict (key) do nothing;

-- ── Sample cake ───────────────────────────────────────────────
insert into cakes (title, price, deposit_percent, description, category, servings, available, featured)
values (
  'Classic Strawberry Layer Cake',
  285.00, 30,
  'Fresh strawberry compote layered between vanilla sponge, frosted in cloud-like whipped cream and crowned with seasonal berries.',
  'Birthday', '12-15 people', true, true
) on conflict do nothing;
