-- Run this in Supabase → SQL Editor → New Query → Run
-- This ADDS to your existing tables, it won't break anything

-- ── Orders table ─────────────────────────────────────────────
create table if not exists orders (
  id             uuid default gen_random_uuid() primary key,
  cake_id        uuid references cakes(id) on delete set null,
  cake_title     text not null,
  cake_image     text,
  cake_price     numeric(10,2),
  deposit_amount numeric(10,2),
  pickup_date    date not null,
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  notes          text,
  status         text default 'pending',
  created_at     timestamptz default now()
);

-- RLS for orders
alter table orders enable row level security;
-- Anyone can insert (place an order)
create policy "Anyone can place order" on orders for insert with check (true);
-- Only Pam (authenticated) can read all orders
create policy "Auth read orders" on orders for select using (auth.role() = 'authenticated');
-- Only Pam can update order status
create policy "Auth update orders" on orders for update using (auth.role() = 'authenticated');
create policy "Auth delete orders" on orders for delete using (auth.role() = 'authenticated');

-- ── Page sections (for editable content on every page) ───────
-- We reuse the existing settings table with keys like:
-- 'page_home', 'page_cakes', 'page_booking', 'page_recipes'
-- No new table needed!

-- Seed default page content
insert into settings (key, value) values
('page_home', '{
  "hero_title": "Pam''s Cooking for Real Life",
  "hero_subtitle": "Handcrafted cakes for life''s sweetest moments",
  "hero_image": "",
  "featured_heading": "Featured Cakes",
  "featured_subtext": "Every cake is made entirely from scratch, just for you.",
  "about_heading": "Real food. Real love.",
  "about_text": "Every cake I make starts with a conversation. I want to understand your story — the love you''re celebrating, the memory you''re creating. Then I bake it in.\n\nI''ve been baking for over a decade, and every cake is made entirely by hand, to order. No shortcuts. No prefab layers. Just real ingredients and a lot of heart.",
  "cta_heading": "Ready for your dream cake?",
  "cta_subtext": "Book a free consultation and let''s talk about your vision."
}')
on conflict (key) do nothing;

insert into settings (key, value) values
('page_cakes', '{
  "heading": "Cake Catalog",
  "subtext": "Every cake made from scratch, just for your occasion."
}')
on conflict (key) do nothing;

insert into settings (key, value) values
('page_recipes', '{
  "heading": "Recipes & Tips",
  "subtext": "Techniques, stories, and recipes from my kitchen to yours."
}')
on conflict (key) do nothing;

insert into settings (key, value) values
('page_booking', '{
  "heading": "Book a Consultation",
  "subtext": "A free 30-minute call to design your perfect cake.",
  "sidebar_text": "30-minute phone or video call\nDiscuss your cake design and flavors\nPlan your timeline and delivery\nPricing and deposit details"
}')
on conflict (key) do nothing;
