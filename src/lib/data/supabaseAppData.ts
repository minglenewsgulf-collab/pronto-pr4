import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import type { Draft, Publication, Report } from "@/lib/types";

type ReportInput = Omit<Report, "id" | "createdAt">;

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function reportSnapshot(report: Report) {
  return report as unknown as Record<string, unknown>;
}

function normalizeReport(row: Record<string, unknown>): Report | null {
  const snapshot = row.snapshot;
  if (snapshot && typeof snapshot === "object") {
    const report = snapshot as Partial<Report>;
    if (report.id && report.name && Array.isArray(report.publications)) {
      return {
        id: String(report.id),
        name: String(report.name),
        clientName: String(report.clientName ?? row.client_name ?? ""),
        projectName: String(report.projectName ?? row.project_name ?? ""),
        startDate: String(report.startDate ?? row.period_start ?? row.created_at ?? new Date().toISOString()),
        endDate: String(report.endDate ?? row.period_end ?? row.created_at ?? new Date().toISOString()),
        createdAt: String(report.createdAt ?? row.created_at ?? new Date().toISOString()),
        publications: report.publications as Publication[],
        folder: report.folder ?? "reports",
      };
    }
  }

  return {
    id: String(row.id),
    name: String(row.name ?? row.title ?? "Untitled report"),
    clientName: String(row.client_name ?? ""),
    projectName: String(row.project_name ?? ""),
    startDate: String(row.period_start ?? row.created_at ?? new Date().toISOString()),
    endDate: String(row.period_end ?? row.created_at ?? new Date().toISOString()),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    publications: [],
    folder: "reports",
  };
}

async function getOwnerId() {
  const { data: user, error } = await getCurrentUser();
  if (error) throw error;
  if (!user) throw new Error("Please sign in first.");
  return user.id;
}

export async function loadReportsFromSupabase(): Promise<Report[]> {
  const ownerId = await getOwnerId();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => normalizeReport(row as Record<string, unknown>))
    .filter((report): report is Report => report !== null);
}

export async function createReportInSupabase(input: ReportInput): Promise<Report> {
  const ownerId = await getOwnerId();
  const supabase = getSupabaseClient();
  const report: Report = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const reachTotal = sum(report.publications.map((publication) => publication.reach));
  const preiTotal = sum(report.publications.map((publication) => publication.prei));
  const preiAvg = report.publications.length ? preiTotal / report.publications.length : null;
  const sentimentSummary = report.publications.reduce(
    (summary, publication) => ({
      ...summary,
      [publication.sentiment]: summary[publication.sentiment] + 1,
    }),
    { positive: 0, neutral: 0, negative: 0 },
  );

  const campaignName = `${report.clientName || "Client"} / ${report.projectName || "Project"}`;
  const campaign = await supabase
    .from("campaigns")
    .insert({
      owner_id: ownerId,
      name: campaignName,
      client_name: report.clientName,
      project_name: report.projectName,
      description: "Created from the report workspace.",
    })
    .select("id")
    .single();

  if (campaign.error) throw campaign.error;

  const reportRow = {
    id: report.id,
    campaign_id: campaign.data.id,
    owner_id: ownerId,
    title: report.name,
    summary: null,
    snapshot: reportSnapshot(report),
    metrics_snapshot: {
      articles_count: report.publications.length,
      reach_total: reachTotal,
      prei_avg: preiAvg,
      sentiment_summary: sentimentSummary,
    },
    ai_output: null,
    formula_version: "local_storage_export_v1",
  };

  const created = await supabase.from("reports").insert(reportRow).select("id").single();
  if (created.error) {
    const fallback = await supabase
      .from("reports")
      .insert({
        id: report.id,
        campaign_id: campaign.data.id,
        owner_id: ownerId,
        name: report.name,
        client_name: report.clientName,
        project_name: report.projectName,
        period_start: report.startDate,
        period_end: report.endDate,
        articles_count: report.publications.length,
        reach_total: reachTotal,
        industry_impact_total: preiTotal,
        industry_impact_avg: preiAvg,
        public_impact_total: preiTotal,
        public_impact_avg: preiAvg,
        sentiment_summary: sentimentSummary,
        word_cloud_json: {},
      })
      .select("id")
      .single();

    if (fallback.error) throw created.error;
  }

  return report;
}

export async function updateReportInSupabase(report: Report): Promise<void> {
  const ownerId = await getOwnerId();
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("reports")
    .update({
      title: report.name,
      snapshot: reportSnapshot(report),
      metrics_snapshot: {
        articles_count: report.publications.length,
        reach_total: sum(report.publications.map((publication) => publication.reach)),
      },
    })
    .eq("id", report.id)
    .eq("owner_id", ownerId);

  if (!error) return;

  const fallback = await supabase
    .from("reports")
    .update({
      name: report.name,
      client_name: report.clientName,
      project_name: report.projectName,
      period_start: report.startDate,
      period_end: report.endDate,
    })
    .eq("id", report.id)
    .eq("owner_id", ownerId);

  if (fallback.error) throw error;
}

export async function deleteReportFromSupabase(reportId: string): Promise<void> {
  const ownerId = await getOwnerId();
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("reports").delete().eq("id", reportId).eq("owner_id", ownerId);
  if (error) throw error;
}

export async function loadExportsAsDraftsFromSupabase(reports: Report[]): Promise<Draft[]> {
  const ownerId = await getOwnerId();
  const supabase = getSupabaseClient();
  const reportById = new Map(reports.map((report) => [report.id, report]));

  const { data, error } = await supabase
    .from("exports")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const exportRow = row as Record<string, unknown>;
    const reportId = String(exportRow.report_id);
    const report = reportById.get(reportId);

    return {
      id: String(exportRow.id),
      reportId,
      reportName: report?.name ?? String(exportRow.file_name ?? "Exported report"),
      clientName: report?.clientName ?? "",
      createdAt: String(exportRow.created_at ?? new Date().toISOString()),
      format: "PDF",
    };
  });
}

export async function deleteExportFromSupabase(exportId: string): Promise<void> {
  const ownerId = await getOwnerId();
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("exports").delete().eq("id", exportId).eq("owner_id", ownerId);
  if (error) throw error;
}
