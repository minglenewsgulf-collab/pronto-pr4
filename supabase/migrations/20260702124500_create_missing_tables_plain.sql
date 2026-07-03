-- PRONTO PR: plain SQL to create only missing tables
-- Run this in Supabase SQL Editor.
--
-- Assumptions:
-- - public.campaigns already exists and has id uuid.
-- - public.articles already exists and has id uuid.
-- - public.export_format enum already exists.
-- - public.export_status enum already exists.
--
-- This file intentionally has:
-- - no procedural blocks
-- - no policies
-- - no triggers
-- - no enum changes
-- - no data deletion

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

create index if not exists reports_owner_id_idx on public.reports(owner_id);
create index if not exists reports_campaign_id_idx on public.reports(campaign_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

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

create index if not exists report_articles_owner_id_idx on public.report_articles(owner_id);
create index if not exists report_articles_report_id_idx on public.report_articles(report_id);
create index if not exists report_articles_article_id_idx on public.report_articles(article_id);

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

create index if not exists exports_owner_id_idx on public.exports(owner_id);
create index if not exists exports_report_id_idx on public.exports(report_id);
create index if not exists exports_status_idx on public.exports(status);
create index if not exists exports_created_at_idx on public.exports(created_at desc);

select
  'PRONTO PR plain missing-tables script finished' as status,
  to_regclass('public.reports') as reports_table,
  to_regclass('public.report_articles') as report_articles_table,
  to_regclass('public.exports') as exports_table;
