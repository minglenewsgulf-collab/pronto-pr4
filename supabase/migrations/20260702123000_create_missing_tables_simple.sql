-- PRONTO PR: create missing tables only, simple version
-- Purpose: continue after the first migration partially created campaigns,
-- articles, and domain_metrics_cache.
--
-- This script intentionally does NOT create RLS policies.
-- If duplicate-policy issues appear later, policies should be added in a
-- separate, focused script after these tables exist.
--
-- Rules followed:
-- - Plain SQL for tables and indexes.
-- - No policy creation in this file.
-- - No table-creation procedural blocks.
-- - No drops.
-- - No data deletion.

-- -----------------------------------------------------------------------------
-- 1. Enum types
-- -----------------------------------------------------------------------------
-- These small procedural checks only create enum types when they are missing.
-- They do not create tables and do not create policies.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'export_status'
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
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'export_format'
  ) then
    create type public.export_format as enum ('xlsx');
  end if;
end $$;

alter type public.export_format add value if not exists 'xlsx';

-- -----------------------------------------------------------------------------
-- 2. reports
-- -----------------------------------------------------------------------------
-- User-owned generated report snapshots for campaigns.

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

-- If reports was created by an earlier failed run but is missing columns, add
-- only the expected missing columns. Existing columns and data are not changed.
alter table public.reports add column if not exists campaign_id uuid references public.campaigns(id) on delete cascade;
alter table public.reports add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.reports add column if not exists title text;
alter table public.reports add column if not exists summary text;
alter table public.reports add column if not exists snapshot jsonb not null default '{}'::jsonb;
alter table public.reports add column if not exists metrics_snapshot jsonb not null default '{}'::jsonb;
alter table public.reports add column if not exists ai_output jsonb;
alter table public.reports add column if not exists formula_version text;
alter table public.reports add column if not exists created_at timestamptz not null default now();
alter table public.reports add column if not exists updated_at timestamptz not null default now();

create index if not exists reports_owner_id_idx on public.reports(owner_id);
create index if not exists reports_campaign_id_idx on public.reports(campaign_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

-- -----------------------------------------------------------------------------
-- 3. report_articles
-- -----------------------------------------------------------------------------
-- Join table between generated reports and articles, with per-report article
-- snapshots so exported reports stay stable even if articles change later.

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

-- If report_articles was partially created, add only missing columns.
alter table public.report_articles add column if not exists report_id uuid references public.reports(id) on delete cascade;
alter table public.report_articles add column if not exists article_id uuid references public.articles(id) on delete restrict;
alter table public.report_articles add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.report_articles add column if not exists title_snapshot text;
alter table public.report_articles add column if not exists url_snapshot text;
alter table public.report_articles add column if not exists domain_snapshot text;
alter table public.report_articles add column if not exists snippet_snapshot text;
alter table public.report_articles add column if not exists sentiment_snapshot text;
alter table public.report_articles add column if not exists placement_snapshot text;
alter table public.report_articles add column if not exists media_type_snapshot text;
alter table public.report_articles add column if not exists industry_impact_snapshot numeric(10, 4);
alter table public.report_articles add column if not exists public_impact_snapshot numeric(10, 4);
alter table public.report_articles add column if not exists prei_components_snapshot jsonb not null default '{}'::jsonb;
alter table public.report_articles add column if not exists created_at timestamptz not null default now();

create unique index if not exists report_articles_report_article_unique_idx on public.report_articles(report_id, article_id);
create index if not exists report_articles_owner_id_idx on public.report_articles(owner_id);
create index if not exists report_articles_report_id_idx on public.report_articles(report_id);
create index if not exists report_articles_article_id_idx on public.report_articles(article_id);

-- -----------------------------------------------------------------------------
-- 4. exports
-- -----------------------------------------------------------------------------
-- Export metadata. Actual files are expected to live in Supabase Storage bucket
-- named exports. MVP export format is xlsx.

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

-- If exports was partially created, add only missing columns.
alter table public.exports add column if not exists report_id uuid references public.reports(id) on delete cascade;
alter table public.exports add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.exports add column if not exists format public.export_format not null default 'xlsx';
alter table public.exports add column if not exists status public.export_status not null default 'pending';
alter table public.exports add column if not exists storage_bucket text not null default 'exports';
alter table public.exports add column if not exists storage_path text;
alter table public.exports add column if not exists file_name text;
alter table public.exports add column if not exists file_size_bytes bigint;
alter table public.exports add column if not exists error_message text;
alter table public.exports add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.exports add column if not exists created_at timestamptz not null default now();
alter table public.exports add column if not exists updated_at timestamptz not null default now();
alter table public.exports add column if not exists completed_at timestamptz;

create index if not exists exports_owner_id_idx on public.exports(owner_id);
create index if not exists exports_report_id_idx on public.exports(report_id);
create index if not exists exports_status_idx on public.exports(status);
create index if not exists exports_created_at_idx on public.exports(created_at desc);

-- -----------------------------------------------------------------------------
-- 5. Completion check
-- -----------------------------------------------------------------------------
select
  'PRONTO PR simple missing-table script finished' as status,
  to_regclass('public.reports') as reports_table,
  to_regclass('public.report_articles') as report_articles_table,
  to_regclass('public.exports') as exports_table;
