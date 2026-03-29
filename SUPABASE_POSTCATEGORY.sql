-- Run in Supabase SQL Editor
-- Adds category column to blog_posts if it doesn't exist
alter table blog_posts add column if not exists category text default '';
