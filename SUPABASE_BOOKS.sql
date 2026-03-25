-- Run in Supabase SQL Editor

-- Books table
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

-- Booking contact requests table (separate from orders)
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
create policy "Anyone can submit contact" on contact_requests for insert with check (true);
create policy "Auth read contacts" on contact_requests for select using (auth.role() = 'authenticated');
create policy "Auth update contacts" on contact_requests for update using (auth.role() = 'authenticated');
create policy "Auth delete contacts" on contact_requests for delete using (auth.role() = 'authenticated');

-- Add books page settings
insert into settings (key, value) values
('page_books', '{
  "heading": "Books & Cookbooks",
  "subtext": "Recipes and cooking wisdom you can take home.",
  "intro": ""
}')
on conflict (key) do nothing;

-- Seed sample book
insert into books (title, price, description, category, available, featured)
values (
  'Pam''s Real Life Recipes',
  24.99,
  'A collection of Pam''s most loved recipes — the ones her family has been requesting for years. Simple ingredients, real flavor.',
  'Cookbook',
  true,
  true
) on conflict do nothing;
