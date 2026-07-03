import type {
  Article,
  ArticleInsert,
  ArticleUpdate,
  Campaign,
  CampaignInsert,
  CampaignUpdate,
  DomainMetricsCache,
  DomainMetricsCacheInsert,
  DomainMetricsCacheUpdate,
  Export,
  ExportInsert,
  ExportUpdate,
  Report,
  ReportArticle,
  ReportArticleInsert,
  ReportArticleUpdate,
  ReportInsert,
  ReportUpdate,
} from "./types";

export interface ListByOwnerParams {
  ownerId: string;
}

export interface ListCampaignArticlesParams {
  ownerId: string;
  campaignId: string;
}

export interface ListReportArticlesParams {
  ownerId: string;
  reportId: string;
}

export interface ListReportExportsParams {
  ownerId: string;
  reportId: string;
}

export interface CampaignRepository {
  listByOwner(params: ListByOwnerParams): Promise<Campaign[]>;
  getById(ownerId: string, campaignId: string): Promise<Campaign | null>;
  create(input: CampaignInsert): Promise<Campaign>;
  update(ownerId: string, campaignId: string, patch: CampaignUpdate): Promise<Campaign>;
  delete(ownerId: string, campaignId: string): Promise<void>;
}

export interface ArticleRepository {
  listByCampaign(params: ListCampaignArticlesParams): Promise<Article[]>;
  getById(ownerId: string, articleId: string): Promise<Article | null>;
  create(input: ArticleInsert): Promise<Article>;
  update(ownerId: string, articleId: string, patch: ArticleUpdate): Promise<Article>;
  markRemoved(ownerId: string, articleId: string): Promise<Article>;
}

export interface ReportRepository {
  listByOwner(params: ListByOwnerParams): Promise<Report[]>;
  listByCampaign(params: { ownerId: string; campaignId: string }): Promise<Report[]>;
  getById(ownerId: string, reportId: string): Promise<Report | null>;
  create(input: ReportInsert): Promise<Report>;
  update(ownerId: string, reportId: string, patch: ReportUpdate): Promise<Report>;
  delete(ownerId: string, reportId: string): Promise<void>;
}

export interface ReportArticleRepository {
  listByReport(params: ListReportArticlesParams): Promise<ReportArticle[]>;
  create(input: ReportArticleInsert): Promise<ReportArticle>;
  update(ownerId: string, reportArticleId: string, patch: ReportArticleUpdate): Promise<ReportArticle>;
  delete(ownerId: string, reportArticleId: string): Promise<void>;
}

export interface ExportRepository {
  listByReport(params: ListReportExportsParams): Promise<Export[]>;
  getById(ownerId: string, exportId: string): Promise<Export | null>;
  create(input: ExportInsert): Promise<Export>;
  update(ownerId: string, exportId: string, patch: ExportUpdate): Promise<Export>;
  delete(ownerId: string, exportId: string): Promise<void>;
}

export interface DomainMetricsCacheRepository {
  getByDomain(domain: string): Promise<DomainMetricsCache | null>;
  upsert(input: DomainMetricsCacheInsert): Promise<DomainMetricsCache>;
  update(domain: string, patch: DomainMetricsCacheUpdate): Promise<DomainMetricsCache>;
}

export interface DataRepositories {
  campaigns: CampaignRepository;
  articles: ArticleRepository;
  reports: ReportRepository;
  reportArticles: ReportArticleRepository;
  exports: ExportRepository;
  domainMetricsCache: DomainMetricsCacheRepository;
}
