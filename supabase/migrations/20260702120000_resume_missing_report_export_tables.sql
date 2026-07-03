-- PRONTO PR resume migration after partial schema apply
-- Current known DB state:
--   Existing tables: campaigns, articles, domain_metrics_cache
--   Missing tables: reports, report_articles, exports
--
-- Safety rules:
-- - Does not recreate existing tables.
-- - Does not drop tables, columns, data, triggers, indexes, or policies.
-- - Creates only missing tables needed to continue the interrupted migration.
-- - Uses IF NOT EXISTS / catalog checks where PostgreSQL supports it.
-- - Stops early with a clear error if required parent tables are malformed.

-- -----------------------------------------------------------------------------
-- 0. Preflight checks
-- -----------------------------------------------------------------------------
-- These checks prevent unclear foreign-key errors such as:
-- "column id referenced in foreign key constraint does not exist".
-- They do not change the database.
do $$
begin
  if to_regclass('public.campaigns') is null then
    raise exception 'Required parent table public.campaigns does not exist. Stop and inspect the partial migration.';
  end if;

  if to_regclass('public.articles') is null then
    raise exception 'Required parent table public.articles does not exist. Stop and inspect the partial migration.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaigns'
      and column_name = 'id'
  ) then
    raise exception 'Required parent column public.campaigns.id does not exist. Stop and inspect campaigns before creating reports.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'articles'
      and column_name = 'id'
  ) then
    raise exception 'Required parent column public.articles.id does not exist. Stop and inspect articles before creating report_articles.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Enum types required by the missing exports table
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'export_status'
  ) then
    create type public.export_status as enum ('pending', 'processing', 'ready', 'failed');
  end if;
end $$;

alter type public.export_status add value if not exists 'pending';
alter type public.export_status add value if not exists 'processing';
alter type public.export_status add value if not exists 'ready';
alter type public.export_status add value if not exists 'failed';

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'export_format'
  ) then
    create type public.export_format as enum ('xlsx');
  end if;
end $$;

alter type public.export_format add value if not exists 'xlsx';

-- -----------------------------------------------------------------------------
-- 2. Shared updated_at trigger helper
-- -----------------------------------------------------------------------------
-- This is needed only for the newly created tables below. It is safe to create or
-- replace because it keeps the conventional updated_at behavior centralized.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Missing table: reports
-- -----------------------------------------------------------------------------
-- Reports are user-owned snapshots of campaign analysis. Snapshot fields keep
-- generated report output stable even if source articles change later.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  summary text,
  snapshot jsonb not null default '{}'::jsonb,
  metrics_snapshot jsonb not null default '{}'::jsonb,
  ai_output jsonb,
  formula_version text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reports is 'Generated PRONTO PR report snapshots for a campaign. User-owned via owner_id.';
comment on column public.reports.snapshot is 'Immutable-ish report snapshot used so exports remain reproducible.';
comment on column public.reports.metrics_snapshot is 'PREI component and domain metric snapshot at report generation time.';
comment on column public.reports.formula_version is 'PREI formula/prompt version used when this report was generated.';

create index if not exists reports_owner_id_idx on public.reports(owner_id);
create index if not exists reports_campaign_id_idx on public.reports(campaign_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

alter table public.reports enable row level security;

-- updated_at trigger for reports, created only if missing.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'reports_set_updated_at'
      and tgrelid = 'public.reports'::regclass
  ) then
    create trigger reports_set_updated_at
    before update on public.reports
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- RLS policies for reports.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports' and policyname = 'Users can select own reports'
  ) then
    execute format(
      'CREATE POLICY %I ON public.reports FOR SELECT TO authenticated using (owner_id = auth.uid())',
      'Users can select own reports'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports' and policyname = 'Users can insert own reports'
  ) then
    execute format(
      'CREATE POLICY %I ON public.reports FOR INSERT TO authenticated with check (owner_id = auth.uid())',
      'Users can insert own reports'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports' and policyname = 'Users can update own reports'
  ) then
    execute format(
      'CREATE POLICY %I ON public.reports FOR UPDATE TO authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      'Users can update own reports'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports' and policyname = 'Users can delete own reports'
  ) then
    execute format(
      'CREATE POLICY %I ON public.reports FOR DELETE TO authenticated using (owner_id = auth.uid())',
      'Users can delete own reports'
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Missing table: report_articles
-- -----------------------------------------------------------------------------
-- Join table between generated reports and articles. Extra snapshot fields are
-- kept here so a report can preserve per-article PREI values at generation time.
create table if not exists public.report_articles (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete cascade,

  title_snapshot text,
  url_snapshot text,
  domain_snapshot text,
  snippet_snapshot text,
  sentiment_snapshot text,
  placement_snapshot text,
  media_type_snapshot text,
  industry_impact_snapshot numeric(10, 4),
  public_impact_snapshot numeric(10, 4),
  prei_components_snapshot jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint report_articles_report_article_unique unique (report_id, article_id)
);

comment on table public.report_articles is 'Articles included in a generated report, with per-report snapshots of article metadata and PREI values.';
comment on column public.report_articles.prei_components_snapshot is 'Snapshot of IndustryImpact/PublicImpact component values used for this report article.';

create index if not exists report_articles_owner_id_idx on public.report_articles(owner_id);
create index if not exists report_articles_report_id_idx on public.report_articles(report_id);
create index if not exists report_articles_article_id_idx on public.report_articles(article_id);

alter table public.report_articles enable row level security;

-- RLS policies for report_articles.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'report_articles' and policyname = 'Users can select own report articles'
  ) then
    execute format(
      'CREATE POLICY %I ON public.report_articles FOR SELECT TO authenticated using (owner_id = auth.uid())',
      'Users can select own report articles'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'report_articles' and policyname = 'Users can insert own report articles'
  ) then
    execute format(
      'CREATE POLICY %I ON public.report_articles FOR INSERT TO authenticated with check (owner_id = auth.uid())',
      'Users can insert own report articles'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'report_articles' and policyname = 'Users can update own report articles'
  ) then
    execute format(
      'CREATE POLICY %I ON public.report_articles FOR UPDATE TO authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      'Users can update own report articles'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'report_articles' and policyname = 'Users can delete own report articles'
  ) then
    execute format(
      'CREATE POLICY %I ON public.report_articles FOR DELETE TO authenticated using (owner_id = auth.uid())',
      'Users can delete own report articles'
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Missing table: exports
-- -----------------------------------------------------------------------------
-- Export metadata points to files in the Supabase Storage bucket named "exports".
-- The MVP format is xlsx only.
create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,

  format public.export_format not null default 'xlsx',
  status public.export_status not null default 'pending',
  storage_bucket text not null default 'exports',
  storage_path text,
  file_name text,
  file_size_bytes bigint,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.exports is 'Metadata for report export files stored in Supabase Storage bucket exports.';
comment on column public.exports.storage_path is 'Path inside the exports storage bucket. Null until export is ready.';
comment on column public.exports.status is 'Export processing state: pending, processing, ready, or failed.';

create index if not exists exports_owner_id_idx on public.exports(owner_id);
create index if not exists exports_report_id_idx on public.exports(report_id);
create index if not exists exports_status_idx on public.exports(status);
create index if not exists exports_created_at_idx on public.exports(created_at desc);

alter table public.exports enable row level security;

-- updated_at trigger for exports, created only if missing.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'exports_set_updated_at'
      and tgrelid = 'public.exports'::regclass
  ) then
    create trigger exports_set_updated_at
    before update on public.exports
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- RLS policies for exports.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'exports' and policyname = 'Users can select own exports'
  ) then
    execute format(
      'CREATE POLICY %I ON public.exports FOR SELECT TO authenticated using (owner_id = auth.uid())',
      'Users can select own exports'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'exports' and policyname = 'Users can insert own exports'
  ) then
    execute format(
      'CREATE POLICY %I ON public.exports FOR INSERT TO authenticated with check (owner_id = auth.uid())',
      'Users can insert own exports'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'exports' and policyname = 'Users can update own exports'
  ) then
    execute format(
      'CREATE POLICY %I ON public.exports FOR UPDATE TO authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      'Users can update own exports'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'exports' and policyname = 'Users can delete own exports'
  ) then
    execute format(
      'CREATE POLICY %I ON public.exports FOR DELETE TO authenticated using (owner_id = auth.uid())',
      'Users can delete own exports'
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Completion marker
-- -----------------------------------------------------------------------------
select
  'PRONTO PR resume migration completed: reports, report_articles, exports are present' as status,
  now() as completed_at;
