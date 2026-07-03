import type { DataRepositories } from "./repositories";

function notImplemented(methodName: string): never {
  throw new Error(methodName + " is not implemented yet. Supabase data access will be added in a later task.");
}

export const dataRepositoryStubs: DataRepositories = {
  campaigns: {
    listByOwner: () => Promise.resolve(notImplemented("campaigns.listByOwner")),
    getById: () => Promise.resolve(notImplemented("campaigns.getById")),
    create: () => Promise.resolve(notImplemented("campaigns.create")),
    update: () => Promise.resolve(notImplemented("campaigns.update")),
    delete: () => Promise.resolve(notImplemented("campaigns.delete")),
  },
  articles: {
    listByCampaign: () => Promise.resolve(notImplemented("articles.listByCampaign")),
    getById: () => Promise.resolve(notImplemented("articles.getById")),
    create: () => Promise.resolve(notImplemented("articles.create")),
    update: () => Promise.resolve(notImplemented("articles.update")),
    markRemoved: () => Promise.resolve(notImplemented("articles.markRemoved")),
  },
  reports: {
    listByOwner: () => Promise.resolve(notImplemented("reports.listByOwner")),
    listByCampaign: () => Promise.resolve(notImplemented("reports.listByCampaign")),
    getById: () => Promise.resolve(notImplemented("reports.getById")),
    create: () => Promise.resolve(notImplemented("reports.create")),
    update: () => Promise.resolve(notImplemented("reports.update")),
    delete: () => Promise.resolve(notImplemented("reports.delete")),
  },
  reportArticles: {
    listByReport: () => Promise.resolve(notImplemented("reportArticles.listByReport")),
    create: () => Promise.resolve(notImplemented("reportArticles.create")),
    update: () => Promise.resolve(notImplemented("reportArticles.update")),
    delete: () => Promise.resolve(notImplemented("reportArticles.delete")),
  },
  exports: {
    listByReport: () => Promise.resolve(notImplemented("exports.listByReport")),
    getById: () => Promise.resolve(notImplemented("exports.getById")),
    create: () => Promise.resolve(notImplemented("exports.create")),
    update: () => Promise.resolve(notImplemented("exports.update")),
    delete: () => Promise.resolve(notImplemented("exports.delete")),
  },
  domainMetricsCache: {
    getByDomain: () => Promise.resolve(notImplemented("domainMetricsCache.getByDomain")),
    upsert: () => Promise.resolve(notImplemented("domainMetricsCache.upsert")),
    update: () => Promise.resolve(notImplemented("domainMetricsCache.update")),
  },
};
