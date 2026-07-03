-- PRONTO PR Supabase schema draft.
-- This migration is intentionally not applied automatically.
-- It creates the first database shape for moving from the localStorage prototype to Supabase.
-- Product-owner confirmations reflected here:
--   1. MVP input is URL-only.
--   2. Full article text is not stored in the database.
--   3. Store title, snippet, metadata, URL, domain, and screenshot_url when available.
--   4. Store two separate indexes only: industry_impact and public_impact.
--   5. Domain metrics cache TTL for MVP is 30 days.
--   6. Export format for MVP is xlsx.
--   7. Normal users cannot physically delete articles; they can set status = 'removed'.
--   8. Supabase service_role bypass is enough for backend jobs, and service_role keys must never be used in frontend code.

-- Article cards are not physically deleted in the MVP model.
-- Status is used to keep history and preserve report correctness.
create type public.article_status as enum ('active', 'removed', 'broken', 'missing');

create type public.article_sentiment as enum ('negative', 'neutral', 'positive');

create type public.article_placement as enum ('news', 'comment', 'interview', 'author_column');

create type public.media_type as enum (
  'industry_specific',
  'adjacent_industry',
  'federal_business',
  'large_general_political',
  'regional'
);

-- xlsx is the MVP export format. Other formats are intentionally not modeled yet.
create type public.export_format as enum ('xlsx');

create type public.export_status as enum ('pending', 'processing', 'ready', 'failed');

-- Shared updated_at trigger helper.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_name text,
  project_name text,
  description text,

  -- Campaigns are long-lived containers. These active aggregates are cached for fast UI loading.
  active_articles_count integer not null default 0 check (active_articles_count >= 0),
  active_industry_impact_total numeric(12,2) not null default 0,
  active_industry_impact_avg numeric(6,2),
  active_public_impact_total numeric(12,2) not null default 0,
  active_public_impact_avg numeric(6,2),
  active_reach_total bigint not null default 0 check (active_reach_total >= 0),

  -- Last report snapshot summary. Full snapshot membership lives in reports/report_articles.
  last_report_date timestamptz,
  last_report_articles_count integer not null default 0 check (last_report_articles_count >= 0),
  last_report_industry_impact_total numeric(12,2) not null default 0,
  last_report_industry_impact_avg numeric(6,2),
  last_report_public_impact_total numeric(12,2) not null default 0,
  last_report_public_impact_avg numeric(6,2),
  last_report_reach_total bigint not null default 0 check (last_report_reach_total >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.campaigns is 'Long-lived PR campaign container owned by one user. Campaigns cache active and last-report aggregates for UI speed.';
comment on column public.campaigns.owner_id is 'References auth.users. Business tables store owner_id instead of user email.';

create table public.domain_metrics_cache (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,

  -- Domain-level metrics come from external APIs. The exact provider payload is kept in JSON for MVP flexibility.
  -- MVP TTL is 30 days. Backend jobs should set expires_at = fetched_at + interval '30 days'.
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  source_used text,
  metrics_json jsonb not null default '{}'::jsonb,
  missing_json jsonb not null default '{}'::jsonb,

  -- Optional normalized fields used by the PREI formula and UI when available.
  monthly_visits bigint check (monthly_visits is null or monthly_visits >= 0),
  authority_score numeric(5,2) check (authority_score is null or (authority_score >= 0 and authority_score <= 100)),
  media_category text,
  media_type public.media_type,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.domain_metrics_cache is 'Backend-only cache for normalized domain metrics. Normal authenticated users get no RLS policies for this table.';
comment on column public.domain_metrics_cache.domain is 'Normalized base domain, e.g. example.com. www is merged and subdomains are treated as part of the main domain for MVP.';
comment on column public.domain_metrics_cache.expires_at is 'MVP cache expiry: 30 days after fetch.';
comment on column public.domain_metrics_cache.metrics_json is 'Raw or normalized provider metrics from PR-CY, Similarweb, Semrush, Ahrefs, Majestic, or fallback sources.';
comment on column public.domain_metrics_cache.missing_json is 'Tracks missing metrics and failed provider fields without inventing values.';

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  domain_metrics_cache_id uuid references public.domain_metrics_cache(id) on delete set null,

  -- MVP is URL-only. Full article text is intentionally not stored.
  url text not null,
  url_canonical text not null,
  domain text not null,
  title text,
  source_name text,
  published_at timestamptz,
  snippet text,
  screenshot_url text,
  metadata_json jsonb not null default '{}'::jsonb,

  status public.article_status not null default 'active',
  status_reason text,
  last_checked_at timestamptz,

  -- Objective or externally enriched metrics.
  reach bigint check (reach is null or reach >= 0),
  views bigint check (views is null or views >= 0),
  authority_score numeric(5,2) check (authority_score is null or (authority_score >= 0 and authority_score <= 100)),
  media_type public.media_type,

  -- AI/parser evaluated fields. Values are constrained to the product-owner approved MVP enums.
  language text,
  sentiment public.article_sentiment,
  placement public.article_placement,

  -- PR-index v1.0 fields. Scores use the Excel-backed 0-100 scale, not the current prototype 0-10 UI scale.
  -- No single combined PREI score is stored yet by product-owner decision.
  industry_impact numeric(5,2) check (industry_impact is null or (industry_impact >= 0 and industry_impact <= 100)),
  public_impact numeric(5,2) check (public_impact is null or (public_impact >= 0 and public_impact <= 100)),
  prei_components jsonb not null default '{}'::jsonb,
  ai_analysis jsonb not null default '{}'::jsonb,
  formula_version text not null default 'prei_v1.0_draft',

  -- Articles included in a report snapshot are locked so historical reporting remains stable.
  report_date timestamptz,
  is_locked boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint articles_unique_campaign_url unique (campaign_id, url_canonical)
);

comment on table public.articles is 'URL-only publication cards inside campaigns. Full article text is not stored in the MVP.';
comment on column public.articles.status is 'active participates in current calculations; removed is user-excluded; broken is request error; missing means removed/404.';
comment on column public.articles.metadata_json is 'Parsed metadata from the article/source, excluding full article text.';
comment on column public.articles.prei_components is 'Formula component JSON, expected to include reach, authority, tone, placement, IndustryMediaScore, PublicMediaScore, and related normalized inputs.';
comment on column public.articles.ai_analysis is 'Validated structured AI output. Frontend should not parse free-form AI text.';

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  client_name text,
  project_name text,
  period_start date,
  period_end date,
  report_date timestamptz not null default now(),

  -- Snapshot aggregates are stored on the report so old reports remain stable even if campaign data changes later.
  articles_count integer not null default 0 check (articles_count >= 0),
  reach_total bigint not null default 0 check (reach_total >= 0),
  industry_impact_total numeric(12,2) not null default 0,
  industry_impact_avg numeric(6,2),
  public_impact_total numeric(12,2) not null default 0,
  public_impact_avg numeric(6,2),
  sentiment_summary jsonb not null default '{}'::jsonb,
  word_cloud_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reports is 'Periodic snapshot of a living campaign. Aggregates are fixed at report creation time.';

create table public.report_articles (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete cascade,

  -- Snapshot copies preserve report correctness if an article is later updated or removed from active calculations.
  article_snapshot jsonb not null default '{}'::jsonb,
  industry_impact numeric(5,2) check (industry_impact is null or (industry_impact >= 0 and industry_impact <= 100)),
  public_impact numeric(5,2) check (public_impact is null or (public_impact >= 0 and public_impact <= 100)),
  formula_version text not null default 'prei_v1.0_draft',

  created_at timestamptz not null default now(),

  constraint report_articles_unique unique (report_id, article_id)
);

comment on table public.report_articles is 'Join table for report snapshots. Keeps article snapshot data for historical reports.';

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,

  format public.export_format not null default 'xlsx',
  storage_bucket text not null default 'exports',
  storage_path text,
  file_name text,
  mime_type text not null default 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  file_size bigint check (file_size is null or file_size >= 0),
  status public.export_status not null default 'pending',
  error_message text,
  generated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.exports is 'Tracks generated xlsx report exports stored in Supabase Storage. Actual file generation is not implemented in this migration.';

create index campaigns_owner_id_idx on public.campaigns(owner_id);
create index articles_owner_id_idx on public.articles(owner_id);
create index articles_campaign_id_idx on public.articles(campaign_id);
create index articles_status_idx on public.articles(status);
create index articles_domain_idx on public.articles(domain);
create index reports_owner_id_idx on public.reports(owner_id);
create index reports_campaign_id_idx on public.reports(campaign_id);
create index report_articles_owner_id_idx on public.report_articles(owner_id);
create index report_articles_report_id_idx on public.report_articles(report_id);
create index report_articles_article_id_idx on public.report_articles(article_id);
create index exports_owner_id_idx on public.exports(owner_id);
create index exports_report_id_idx on public.exports(report_id);
create index domain_metrics_cache_expires_at_idx on public.domain_metrics_cache(expires_at);

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create trigger domain_metrics_cache_set_updated_at
before update on public.domain_metrics_cache
for each row execute function public.set_updated_at();

create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create trigger exports_set_updated_at
before update on public.exports
for each row execute function public.set_updated_at();

-- RLS is enabled for all tables.
-- User-owned tables generally allow authenticated users to CRUD only rows where owner_id = auth.uid().
-- Exception: authenticated users cannot physically delete articles; they should update status to 'removed'.
-- Backend jobs may use Supabase service_role bypass, but service_role keys must never be exposed to frontend code.
-- domain_metrics_cache intentionally has no client policies and remains backend-only.
alter table public.campaigns enable row level security;
alter table public.articles enable row level security;
alter table public.reports enable row level security;
alter table public.report_articles enable row level security;
alter table public.exports enable row level security;
alter table public.domain_metrics_cache enable row level security;

create policy "Users can select own campaigns"
on public.campaigns for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert own campaigns"
on public.campaigns for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own campaigns"
on public.campaigns for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete own campaigns"
on public.campaigns for delete
to authenticated
using (owner_id = auth.uid());

create policy "Users can select own articles"
on public.articles for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert own articles"
on public.articles for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own articles"
on public.articles for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- No delete policy for articles: normal users must not physically delete publication cards.
-- To exclude an article from calculations, update status to 'removed'.

create policy "Users can select own reports"
on public.reports for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert own reports"
on public.reports for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own reports"
on public.reports for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete own reports"
on public.reports for delete
to authenticated
using (owner_id = auth.uid());

create policy "Users can select own report articles"
on public.report_articles for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert own report articles"
on public.report_articles for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own report articles"
on public.report_articles for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete own report articles"
on public.report_articles for delete
to authenticated
using (owner_id = auth.uid());

create policy "Users can select own exports"
on public.exports for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert own exports"
on public.exports for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own exports"
on public.exports for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete own exports"
on public.exports for delete
to authenticated
using (owner_id = auth.uid());

comment on table public.domain_metrics_cache is 'Backend-only cache for normalized domain metrics. RLS is enabled and no authenticated-user policies are defined, so normal clients cannot read or write this table.';
