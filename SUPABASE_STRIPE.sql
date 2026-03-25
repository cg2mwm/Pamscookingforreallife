-- Run this in Supabase → SQL Editor → New Query → Run
-- Adds Stripe payment tracking to the orders table

alter table orders
  add column if not exists stripe_session_id text;

create index if not exists orders_stripe_session_id_idx
  on orders (stripe_session_id);

-- Allow the get-order function to look up by session_id
-- (the function uses service key so bypasses RLS anyway, but this is good practice)
create policy if not exists "Service read orders by session"
  on orders for select
  using (true);
