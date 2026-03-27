-- Run in Supabase SQL Editor

-- Photo galleries (each gallery = one cake's making process)
create table if not exists photo_galleries (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  cover_image text,
  category    text default 'Cake Process',
  created_at  timestamptz default now()
);

alter table photo_galleries enable row level security;
create policy "Public read galleries" on photo_galleries for select using (true);
create policy "Auth write galleries"  on photo_galleries for all using (auth.role() = 'authenticated');

-- Individual photos inside a gallery
create table if not exists gallery_photos (
  id          uuid default gen_random_uuid() primary key,
  gallery_id  uuid references photo_galleries(id) on delete cascade,
  image_url   text not null,
  caption     text,
  step_number integer default 0,
  created_at  timestamptz default now()
);

alter table gallery_photos enable row level security;
create policy "Public read gallery_photos" on gallery_photos for select using (true);
create policy "Auth write gallery_photos"  on gallery_photos for all using (auth.role() = 'authenticated');
