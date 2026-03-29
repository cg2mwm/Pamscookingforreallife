-- Run in Supabase SQL Editor
-- Normalizes all existing categories: trims spaces and applies Title Case
-- so "wedding", " Wedding", "WEDDING" all become "Wedding"

-- Cakes
UPDATE cakes
SET category = initcap(trim(lower(category)))
WHERE category IS NOT NULL AND category != '';

-- Books
UPDATE books
SET category = initcap(trim(lower(category)))
WHERE category IS NOT NULL AND category != '';

-- Blog posts / Recipes
UPDATE blog_posts
SET category = initcap(trim(lower(category)))
WHERE category IS NOT NULL AND category != '';

-- Photo galleries
UPDATE photo_galleries
SET category = initcap(trim(lower(category)))
WHERE category IS NOT NULL AND category != '';
