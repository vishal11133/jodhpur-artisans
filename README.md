# House of Crafts

Handicraft e-commerce site for House of Crafts: landing, sign up, collection, cart, checkout, and orders. Uses **Supabase** for auth and database; deploy on **Vercel** as a static site.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable **Email**.
3. In **SQL Editor**, run the contents of `supabase/schema.sql` to create tables, RLS, trigger, and seed products.

### 2. Config (local)

Copy `.env.example` to `.env` and set:

- `SUPABASE_URL` – Project URL (Settings → API)
- `SUPABASE_ANON_KEY` – anon/public key

For **local static files**, the app reads from `js/config.js`. Either:

- Edit `js/config.js` and set `window.__SUPABASE_URL__` and `window.__SUPABASE_ANON_KEY__` (do not commit real keys), or
- Run a small build step that injects env into `config.js`.

### 3. Run locally

Serve the folder with any static server, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Open `http://localhost:8000` (or the port shown). Sign up and login work once Supabase URL and anon key are set.

### 4. Deploy on Vercel

1. Push the repo and connect it to Vercel.
2. In Vercel **Project → Settings → Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. For a static deploy with no build:
   - Build Command: leave empty or set to `echo "no build"`.
   - Output Directory: `.` (root).
4. To inject Supabase keys into the client on Vercel, set **Build Command** to: `node scripts/inject-config.js`. Leave **Output Directory** as `.` (root). The script writes `SUPABASE_URL` and `SUPABASE_ANON_KEY` from env into `js/config.js`.

## Pages

- **index.html** – Landing (hero, USPs, heritage, collections, trending products, newsletter).
- **signup.html** – Create account (email/password; optional full name, phone).
- **login.html** – Sign in; redirect param supported.
- **collection.html** – Products (optional `?category=...` or `?badge=new_arrival|best_seller`).
- **cart.html** – Cart (localStorage); product details loaded from Supabase when available.
- **checkout.html** – Requires login; shipping form; creates order + order_items in Supabase, then redirects to confirmation.
- **order-confirmation.html** – Thank-you and order ID (`?id=...`).
- **account.html** – My orders (requires login).

## Supabase schema (summary)

- **profiles** – id, full_name, phone (trigger from `auth.users`).
- **products** – id, name, slug, category, price, image_url, badge; public read.
- **orders** – user_id, status, shipping_address (jsonb), total; RLS: user insert/select own.
- **order_items** – order_id, product_id, quantity, price_at_order; RLS: user insert/select for own orders.
- **newsletter_subscribers** – email; insert only.

No payment integration; orders are stored with status (e.g. pending) for offline or future payment handling.
