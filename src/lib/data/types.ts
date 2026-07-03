export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = Record<string, JsonValue>;

export type ArticleStatus = "active" | "removed" | "broken" | "missing";
export type ArticleSentiment = "negative" | "neutral" | "positive";
export type ArticlePlacement = "news" | "comment" | "interview" | "author_column";
export type MediaType =
  | "industry_specific"
  | "adjacent_industry"
  | "federal_business"
  | "large_general_political"
  | "regional";
export type ExportFormat = "xlsx";
export type ExportStatus = "pending" | "processing" | "ready" | "failed";

export interface Campaign {
  id: string;
  owner_id: string;
  name: string;
  client_name: string | null;
  project_name: string | null;
  description: string | null;
  active_articles_count: number;
  active_industry_impact_total: number;
  active_industry_impact_avg: number | null;
  active_public_impact_total: number;
  active_public_impact_avg: number | null;
  active_reach_total: number;
  last_report_date: string | null;
  last_report_articles_count: number;
  last_report_industry_impact_total: number;
  last_report_industry_impact_avg: number | null;
  last_report_public_impact_total: number;
  last_report_public_impact_avg: number | null;
  last_report_reach_total: number;
  created_at: string;
  updated_at: string;
}

export interface DomainMetricsCache {
  id: string;
  domain: string;
  fetched_at: string;
  expires_at: string;
  source_used: string | null;
  metrics_json: JsonRecord;
  missing_json: JsonRecord;
  monthly_visits: number | null;
  authority_score: number | null;
  media_category: string | null;
  media_type: MediaType | null;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  campaign_id: string;
  owner_id: string;
  domain_metrics_cache_id: string | null;
  url: string;
  url_canonical: string;
  domain: string;
  title: string | null;
  source_name: string | null;
  published_at: string | null;
  snippet: string | null;
  screenshot_url: string | null;
  metadata_json: JsonRecord;
  status: ArticleStatus;
  status_reason: string | null;
  last_checked_at: string | null;
  reach: number | null;
  views: number | null;
  authority_score: number | null;
  media_type: MediaType | null;
  language: string | null;
  sentiment: ArticleSentiment | null;
  placement: ArticlePlacement | null;
  industry_impact: number | null;
  public_impact: number | null;
  prei_components: JsonRecord;
  ai_analysis: JsonRecord;
  formula_version: string;
  report_date: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  campaign_id: string;
  owner_id: string;
  name: string;
  client_name: string | null;
  project_name: string | null;
  period_start: string | null;
  period_end: string | null;
  report_date: string;
  articles_count: number;
  reach_total: number;
  industry_impact_total: number;
  industry_impact_avg: number | null;
  public_impact_total: number;
  public_impact_avg: number | null;
  sentiment_summary: JsonRecord;
  word_cloud_json: JsonRecord;
  created_at: string;
  updated_at: string;
}

export interface ReportArticle {
  id: string;
  report_id: string;
  article_id: string;
  owner_id: string;
  article_snapshot: JsonRecord;
  industry_impact: number | null;
  public_impact: number | null;
  formula_version: string;
  created_at: string;
}

export interface Export {
  id: string;
  report_id: string;
  owner_id: string;
  format: ExportFormat;
  storage_bucket: string;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string;
  file_size: number | null;
  status: ExportStatus;
  error_message: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignInsert = Omit<Campaign, "id" | "active_articles_count" | "active_industry_impact_total" | "active_industry_impact_avg" | "active_public_impact_total" | "active_public_impact_avg" | "active_reach_total" | "last_report_date" | "last_report_articles_count" | "last_report_industry_impact_total" | "last_report_industry_impact_avg" | "last_report_public_impact_total" | "last_report_public_impact_avg" | "last_report_reach_total" | "created_at" | "updated_at">;
export type CampaignUpdate = Partial<Omit<Campaign, "id" | "owner_id" | "created_at" | "updated_at">>;

export type ArticleInsert = Omit<Article, "id" | "status" | "metadata_json" | "prei_components" | "ai_analysis" | "formula_version" | "is_locked" | "created_at" | "updated_at"> & Partial<Pick<Article, "status" | "metadata_json" | "prei_components" | "ai_analysis" | "formula_version" | "is_locked">>;
export type ArticleUpdate = Partial<Omit<Article, "id" | "owner_id" | "campaign_id" | "created_at" | "updated_at">>;

export type ReportInsert = Omit<Report, "id" | "report_date" | "articles_count" | "reach_total" | "industry_impact_total" | "industry_impact_avg" | "public_impact_total" | "public_impact_avg" | "sentiment_summary" | "word_cloud_json" | "created_at" | "updated_at"> & Partial<Pick<Report, "report_date" | "sentiment_summary" | "word_cloud_json">>;
export type ReportUpdate = Partial<Omit<Report, "id" | "owner_id" | "campaign_id" | "created_at" | "updated_at">>;

export type ReportArticleInsert = Omit<ReportArticle, "id" | "created_at">;
export type ReportArticleUpdate = Partial<Omit<ReportArticle, "id" | "owner_id" | "report_id" | "article_id" | "created_at">>;

export type ExportInsert = Omit<Export, "id" | "format" | "storage_bucket" | "mime_type" | "status" | "created_at" | "updated_at"> & Partial<Pick<Export, "format" | "storage_bucket" | "mime_type" | "status">>;
export type ExportUpdate = Partial<Omit<Export, "id" | "owner_id" | "report_id" | "created_at" | "updated_at">>;

export type DomainMetricsCacheInsert = Omit<DomainMetricsCache, "id" | "fetched_at" | "expires_at" | "metrics_json" | "missing_json" | "created_at" | "updated_at"> & Partial<Pick<DomainMetricsCache, "fetched_at" | "expires_at" | "metrics_json" | "missing_json">>;
export type DomainMetricsCacheUpdate = Partial<Omit<DomainMetricsCache, "id" | "domain" | "created_at" | "updated_at">>;
