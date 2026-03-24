# Pam's Cooking for Real Life — Setup Guide

## Step 1 — Create a Supabase account (free)

1. Go to **supabase.com** → Sign up free
2. Click **New Project** → name it `pams-cooking` → set a database password → Create
3. Wait ~2 minutes for it to provision

## Step 2 — Run the database setup

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `SUPABASE_SETUP.sql` from this folder
4. Copy everything and paste it into the SQL editor
5. Click **Run** (green button)
6. You should see "Success" — your tables are created

## Step 3 — Get your Supabase keys

1. In Supabase, go to **Project Settings → API**
2. Copy the **Project URL** (looks like `https://abcdef.supabase.co`)
3. Copy the **anon/public** key (long string starting with `eyJ...`)

## Step 4 — Add keys to Netlify

1. Go to your Netlify site → **Site configuration → Environment variables**
2. Add two variables:
   - Key: `VITE_SUPABASE_URL`  → Value: your Project URL
   - Key: `VITE_SUPABASE_ANON_KEY` → Value: your anon key
3. Click **Save**
4. Go to **Deploys** → **Trigger deploy** → **Deploy site**

## Step 5 — Create Pam's login

1. In Supabase, go to **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter Pam's email and a strong password
4. Click **Create user**

## Step 6 — Log in to the admin

1. Go to `your-site.netlify.app/my-kitchen`
2. Enter the email and password from Step 5
3. You're in! 🎂

## Admin URL (secret — don't share)
`/my-kitchen` — no link to this appears anywhere on the public site.

## What Pam can do from the admin:
- ✅ Add / edit / delete cakes with photos
- ✅ Add / edit / delete recipes & blog posts
- ✅ Manage booking availability on a visual calendar
- ✅ Edit homepage text, about story, tagline
- ✅ Set payment method (PayPal, Venmo, etc.)
- ✅ Upload images directly from her computer

All changes appear on the site **instantly** — no rebuilds needed.
