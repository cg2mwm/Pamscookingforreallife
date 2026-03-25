-- Run this in Supabase SQL Editor

create table if not exists books (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  price       numeric(10,2) not null default 0,
  description text,
  category    text default 'Cookbook',
  image_url   text,
  buy_link    text,
  available   boolean default true,
  featured    boolean default false,
  created_at  timestamptz default now()
);
alter table books enable row level security;
create policy "Public read books" on books for select using (true);
create policy "Auth write books"  on books for all using (auth.role() = 'authenticated');

create table if not exists contact_requests (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  email        text not null,
  phone        text,
  message      text,
  request_date date,
  request_slot text,
  status       text default 'new',
  created_at   timestamptz default now()
);
alter table contact_requests enable row level security;
create policy "Anyone submit contact"  on contact_requests for insert with check (true);
create policy "Auth read contacts"     on contact_requests for select using (auth.role() = 'authenticated');
create policy "Auth update contacts"   on contact_requests for update using (auth.role() = 'authenticated');
create policy "Auth delete contacts"   on contact_requests for delete using (auth.role() = 'authenticated');

insert into settings (key, value) values
('page_books', '{"heading":"Books & Cookbooks","subtext":"Recipes and cooking wisdom you can take home.","intro":""}'),
('theme', '{"color_primary":"#2D5233","color_secondary":"#6B9E70","color_accent":"#4A7A50","color_bg":"#FDFAF4","color_bg_dark":"#F0EBE0","color_text":"#2A3D2E","color_nav":"#2D5233","font_heading":"Dancing Script","font_body":"Lato","button_radius":"100px","card_radius":"6px"}')
on conflict (key) do nothing;

insert into books (title, price, description, category, available, featured)
values ('Pam''s Real Life Recipes', 24.99, 'A collection of Pam''s most loved recipes — the ones her family has been requesting for years.', 'Cookbook', true, true)
on conflict do nothing;
