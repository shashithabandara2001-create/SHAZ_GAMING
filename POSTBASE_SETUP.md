# SHAZ Gaming — Postbase comments setup

The V12 community wall is wired for **Postbase**, not Supabase.

1. Create/open your Postbase project.
2. Create the `comments` table using `postbase.sql`.
3. Configure public RLS/database permissions so visitors can **SELECT** and **INSERT** comments only.
4. In Postbase, get the browser-safe **anon key**, project ID, and project URL.
5. Put those three values in `postbase-config.js`:

```js
window.SHAZ_POSTBASE_CONFIG = {
  url: 'https://YOUR-POSTBASE-INSTANCE',
  anonKey: 'pb_anon_...',
  projectId: 'your-project-id'
};
```

Never put a `pb_service_...` service-role key in the website.

The site loads `postbasejs` as a browser ES module and uses the normal `.from().select()` / `.insert()` query style supported by Postbase.
