# Data Layer

This folder is reserved for the app data layer.

Current status:

- The existing prototype still uses `src/lib/store.tsx` and `localStorage`.
- Do not replace the current store until Supabase Auth, database schema, and RLS are ready.
- New Supabase-backed data functions should be added here in small steps.

Expected future modules:

- `auth` helpers for Supabase Auth.
- `campaigns` data access.
- `articles` / `publications` data access.
- `reports` data access.
- `domainMetrics` cache access.
- `exports` data access.
