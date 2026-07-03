import { getCurrentUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import type { Report } from "@/lib/types";

import { downloadExportFile, uploadExportFile } from "./exports";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface ExportReportResult {
  exportId: string;
  fileName: string;
  storagePath: string;
}

function safeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "pronto-pr-report"
  );
}

function numberTotal(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

function buildPlaceholderXlsx(report: Report) {
  const rows = [
    ["PRONTO PR MVP export"],
    ["Report", report.name],
    ["Client", report.clientName],
    ["Project", report.projectName],
    ["Period start", report.startDate],
    ["Period end", report.endDate],
    ["Created", report.createdAt],
    [],
    ["Title", "Source", "URL", "Sentiment", "Reach", "Views", "PREI"],
    ...report.publications.map((publication) => [
      publication.title,
      publication.source,
      publication.url,
      publication.sentiment,
      String(publication.reach),
      String(publication.views),
      String(publication.prei),
    ]),
  ];

  const content = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  return new Blob([content], { type: XLSX_MIME_TYPE });
}

async function ensureExportCampaign(ownerId: string, report: Report) {
  const supabase = getSupabaseClient();
  const name = `${report.clientName || "Client"} / ${report.projectName || "Project"}`;

  const existing = await supabase
    .from("campaigns")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("name", name)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id as string;

  const created = await supabase
    .from("campaigns")
    .insert({
      owner_id: ownerId,
      name,
      client_name: report.clientName,
      project_name: report.projectName,
      description: "Created automatically for MVP report exports.",
    })
    .select("id")
    .single();

  if (created.error) throw created.error;
  return created.data.id as string;
}

async function ensureExportReport(ownerId: string, campaignId: string, report: Report) {
  const supabase = getSupabaseClient();

  const existing = await supabase
    .from("reports")
    .select("id")
    .eq("id", report.id)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id as string;

  const reachTotal = numberTotal(report.publications.map((publication) => publication.reach));
  const preiTotal = numberTotal(report.publications.map((publication) => publication.prei));
  const preiAvg = report.publications.length ? preiTotal / report.publications.length : null;
  const sentimentSummary = report.publications.reduce(
    (summary, publication) => ({
      ...summary,
      [publication.sentiment]: summary[publication.sentiment] + 1,
    }),
    { positive: 0, neutral: 0, negative: 0 },
  );

  const plainSchemaInsert = await supabase
    .from("reports")
    .insert({
      id: report.id,
      campaign_id: campaignId,
      owner_id: ownerId,
      title: report.name,
      summary: null,
      snapshot: report as unknown as Record<string, unknown>,
      metrics_snapshot: {
        articles_count: report.publications.length,
        reach_total: reachTotal,
        prei_avg: preiAvg,
        sentiment_summary: sentimentSummary,
      },
      ai_output: null,
      formula_version: "local_storage_export_v1",
    })
    .select("id")
    .single();

  if (!plainSchemaInsert.error) return plainSchemaInsert.data.id as string;

  const originalSchemaInsert = await supabase
    .from("reports")
    .insert({
      id: report.id,
      campaign_id: campaignId,
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

  if (originalSchemaInsert.error) throw plainSchemaInsert.error;
  return originalSchemaInsert.data.id as string;
}

async function createExportRecord(input: {
  exportId: string;
  ownerId: string;
  reportId: string;
  fileName: string;
  fileSize: number;
  storagePath: string;
}) {
  const supabase = getSupabaseClient();

  const plainSchemaInsert = await supabase
    .from("exports")
    .insert({
      id: input.exportId,
      report_id: input.reportId,
      owner_id: input.ownerId,
      format: "xlsx",
      status: "ready",
      storage_bucket: "exports",
      storage_path: input.storagePath,
      file_name: input.fileName,
      file_size_bytes: input.fileSize,
      error_message: null,
      metadata: { source: "local_storage_mvp_export" },
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (!plainSchemaInsert.error) return;

  const originalSchemaInsert = await supabase
    .from("exports")
    .insert({
      id: input.exportId,
      report_id: input.reportId,
      owner_id: input.ownerId,
      format: "xlsx",
      storage_bucket: "exports",
      storage_path: input.storagePath,
      file_name: input.fileName,
      mime_type: XLSX_MIME_TYPE,
      file_size: input.fileSize,
      status: "ready",
      error_message: null,
      generated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (originalSchemaInsert.error) throw plainSchemaInsert.error;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportReportToSupabaseStorage(report: Report): Promise<ExportReportResult> {
  const { data: authUser, error: userError } = await getCurrentUser();
  if (userError) throw userError;
  if (!authUser) throw new Error("Please sign in before exporting reports.");

  const ownerId = authUser.id;
  const exportId = crypto.randomUUID();
  const fileName = `${safeFileName(report.name)}-${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;
  const file = buildPlaceholderXlsx(report);

  const campaignId = await ensureExportCampaign(ownerId, report);
  const supabaseReportId = await ensureExportReport(ownerId, campaignId, report);

  const upload = await uploadExportFile({
    ownerId,
    reportId: supabaseReportId,
    exportId,
    fileName,
    file,
    contentType: XLSX_MIME_TYPE,
  });

  if (upload.error) throw upload.error;
  if (!upload.data) throw new Error("Export upload failed.");

  await createExportRecord({
    exportId,
    ownerId,
    reportId: supabaseReportId,
    fileName,
    fileSize: file.size,
    storagePath: upload.data.path,
  });

  const download = await downloadExportFile({ path: upload.data.path });
  if (download.error) throw download.error;
  if (!download.data) throw new Error("Export download failed.");

  saveBlob(download.data, fileName);

  return {
    exportId,
    fileName,
    storagePath: upload.data.path,
  };
}
