-- Run in Supabase SQL Editor

-- Add category column to blog_posts
alter table blog_posts add column if not exists category text default '';

-- Seed the settings keys for custom categories (won't overwrite existing)
insert into settings (key, value) values
  ('cake_categories',  '["Wedding","Birthday","Anniversary","Seasonal","Custom"]'),
  ('book_categories',  '["Cookbook","Recipe Book","Other"]'),
  ('post_categories',  '["Recipe","Tip","Tutorial","Story","Seasonal"]'),
  ('photo_categories', '["Cake Process","Wedding","Birthday","Custom","Behind the Scenes","Decoration"]')
on conflict (key) do nothing;
