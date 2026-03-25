-- Run in Supabase SQL Editor

-- Add type column to availability (pickup vs consultation)
alter table availability
  add column if not exists type text not null default 'consultation';

-- Update any existing dates to 'consultation' by default
update availability set type = 'consultation' where type is null or type = 'consultation';

-- Create index for fast filtering by type
create index if not exists availability_type_idx on availability (type);
