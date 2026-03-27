-- Run in Supabase SQL Editor
alter table cakes       add column if not exists sort_order integer default 0;
alter table books       add column if not exists sort_order integer default 0;
alter table blog_posts  add column if not exists sort_order integer default 0;
alter table photo_galleries add column if not exists sort_order integer default 0;

-- Set initial sort order based on creation date
update cakes       set sort_order = 0 where sort_order is null;
update books       set sort_order = 0 where sort_order is null;
update blog_posts  set sort_order = 0 where sort_order is null;
update photo_galleries set sort_order = 0 where sort_order is null;
