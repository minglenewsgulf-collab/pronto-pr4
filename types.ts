export type Sentiment = "positive" | "neutral" | "negative";

export interface Publication {
  id: string;
  url: string;
  title: string;
  source: string;
  previewImage: string;
  reach: number;
  views: number;
  prei: number;
  sentiment: Sentiment;
  publishedAt: string;
  excerpt: string;
  reachEdited?: boolean;
  viewsEdited?: boolean;
  // Detail-page signals
  mediaAuthority?: number; // 0-100
  placement?: "Homepage" | "Section front" | "Article" | "Mention";
  influence?: number; // 0-100
  hasBacklink?: boolean;
  republications?: number;
  brandSearchLift?: boolean;
  trendsGrowth?: boolean;
}

export interface Report {
  id: string;
  name: string;
  clientName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  publications: Publication[];
  folder?: "reports" | "drafts" | "projects" | "campaigns";
}

export interface Draft {
  id: string;
  reportId: string;
  reportName: string;
  clientName: string;
  createdAt: string;
  format: "PDF" | "Workspace";
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
}
