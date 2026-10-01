# SHAZ Gaming — Comment System Setup

The website now uses Supabase instead of the Facebook Comments plugin. Visitors can enter a name and comment, and comments are stored in a shared PostgreSQL table and shown newest-first.

## 1. Create the database table
Open your Supabase project -> SQL Editor and run the contents of `supabase.sql`.

## 2. Get the browser credentials
In Supabase, open Project Settings -> API. Copy:
- Project URL
- Publishable/anon public key

Never use the `service_role` key in the website.

## 3. Add the credentials
Open `supabase-config.js` and replace:
- `https://YOUR-PROJECT.supabase.co`
- `YOUR_SUPABASE_ANON_PUBLIC_KEY`

## 4. Deploy
Upload/push the updated site to Vercel. The comments will then be shared by every visitor using the same database.

### Included behavior
- Name + comment form
- Shared persistent comments
- Newest comments first
- Live count after loading/posting
- Manual refresh
- Input length validation
- Safe HTML escaping
- Mobile responsive layout
- No Facebook SDK dependency
