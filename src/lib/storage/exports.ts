import { getSupabaseClient } from "@/lib/supabase";

export const EXPORTS_BUCKET = "exports";

export interface ExportStoragePathInput {
  ownerId: string;
  reportId: string;
  exportId: string;
  fileName: string;
}

export interface UploadExportFileInput extends ExportStoragePathInput {
  file: Blob | ArrayBuffer | Uint8Array;
  contentType?: string;
  upsert?: boolean;
}

export interface DownloadExportFileInput {
  path: string;
}

export interface CreateExportSignedUrlInput extends DownloadExportFileInput {
  expiresInSeconds?: number;
}

export interface ListExportFilesInput {
  ownerId: string;
  reportId?: string;
  limit?: number;
  offset?: number;
}

export interface DeleteExportFileInput {
  path: string;
}

export interface ExportStorageResult<T> {
  data: T | null;
  error: Error | null;
}

function cleanPathSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildExportStoragePath({
  ownerId,
  reportId,
  exportId,
  fileName,
}: ExportStoragePathInput) {
  const safeFileName = cleanPathSegment(fileName) || "export.xlsx";

  return [
    cleanPathSegment(ownerId),
    "reports",
    cleanPathSegment(reportId),
    cleanPathSegment(exportId),
    safeFileName,
  ].join("/");
}

export async function uploadExportFile({
  ownerId,
  reportId,
  exportId,
  fileName,
  file,
  contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  upsert = false,
}: UploadExportFileInput): Promise<ExportStorageResult<{ bucket: string; path: string }>> {
  const supabase = getSupabaseClient();
  const path = buildExportStoragePath({ ownerId, reportId, exportId, fileName });

  const { error } = await supabase.storage.from(EXPORTS_BUCKET).upload(path, file, {
    contentType,
    upsert,
  });

  return {
    data: error ? null : { bucket: EXPORTS_BUCKET, path },
    error,
  };
}

export async function downloadExportFile({
  path,
}: DownloadExportFileInput): Promise<ExportStorageResult<Blob>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(EXPORTS_BUCKET).download(path);

  return {
    data,
    error,
  };
}

export async function createExportSignedUrl({
  path,
  expiresInSeconds = 60 * 5,
}: CreateExportSignedUrlInput): Promise<ExportStorageResult<string>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(EXPORTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  return {
    data: data?.signedUrl ?? null,
    error,
  };
}

export async function listExportFiles({
  ownerId,
  reportId,
  limit = 100,
  offset = 0,
}: ListExportFilesInput) {
  const supabase = getSupabaseClient();
  const folder = reportId
    ? [cleanPathSegment(ownerId), "reports", cleanPathSegment(reportId)].join("/")
    : cleanPathSegment(ownerId);

  const { data, error } = await supabase.storage.from(EXPORTS_BUCKET).list(folder, {
    limit,
    offset,
    sortBy: { column: "created_at", order: "desc" },
  });

  return {
    data,
    error,
  };
}

export async function deleteExportFile({ path }: DeleteExportFileInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(EXPORTS_BUCKET).remove([path]);

  return {
    data,
    error,
  };
}
