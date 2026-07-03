import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, aggregate, formatNumber, formatPrei } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PublicationCard } from "@/components/PublicationCard";
import { WordCloud } from "@/components/WordCloud";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Download,
  Pencil,
  Sparkles,
  Radio,
  Eye,
  TrendingUp,
  ArrowUpRight,
  FileText,
  Palette,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports/$reportId")({
  head: () => ({
    meta: [{ title: `Report · ProntoPR` }],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { reportId } = Route.useParams();
  const { getReport, saveDraft } = useApp();
  const navigate = useNavigate();
  const report = getReport(reportId);

  const [openExport, setOpenExport] = useState(false);

  if (!report) {
    return (
      <div className="px-8 py-20 text-center">
        <h2 className="text-xl font-semibold">Report not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted or hasn't been created yet.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/workspace" })}>
          Back to workspace
        </Button>
      </div>
    );
  }

  const summary = aggregate(report.publications);
  const topFive = useMemo(
    () => [...report.publications].sort((a, b) => b.prei - a.prei).slice(0, 5),
    [report.publications],
  );
  const sentimentData = [
    { name: "Positive", value: summary.sentiment.positive, color: "var(--success)" },
    { name: "Neutral", value: summary.sentiment.neutral, color: "var(--muted-foreground)" },
    { name: "Negative", value: summary.sentiment.negative, color: "var(--destructive)" },
  ].filter((d) => d.value > 0);

  const wordSource = report.publications.map((p) => `${p.title} ${p.excerpt}`).join(" ");


  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>{report.clientName}</span>
              <span>·</span>
              <span>{report.projectName}</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{report.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>
                Period:{" "}
                <span className="font-medium text-foreground">
                  {format(new Date(report.startDate), "MMM d, yyyy")} —{" "}
                  {format(new Date(report.endDate), "MMM d, yyyy")}
                </span>
              </span>
              <span>
                Created:{" "}
                <span className="font-medium text-foreground">
                  {format(new Date(report.createdAt), "MMM d, yyyy")}
                </span>
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate({ to: "/workspace" })}
            >
              <Pencil className="h-4 w-4" /> Edit report
            </Button>
            <Button className="gap-2" onClick={() => setOpenExport(true)}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Dashboard grid */}
        <div className="mt-10 grid auto-rows-[minmax(160px,auto)] grid-cols-12 gap-4">
          {/* Widget 1 — PREI hero */}
          <Widget className="col-span-12 md:col-span-5 row-span-2">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Company PREI score</span>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-7xl font-semibold tracking-tight">{formatPrei(summary.prei)}</span>
                  <span className="pb-3 text-sm text-muted-foreground">/ 10</span>
                </div>
                <div
                  className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, summary.prei * 10)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Average PREI across {summary.count} publication
                  {summary.count === 1 ? "" : "s"}.
                </p>
              </div>
            </div>
          </Widget>

          {/* Widget 2 — Reach */}
          <Widget className="col-span-6 md:col-span-4">
            <KpiBlock
              icon={Radio}
              label="Total reach"
              value={formatNumber(summary.reach)}
              hint="Aggregated audience"
            />
          </Widget>

          {/* Widget 3 — Views */}
          <Widget className="col-span-6 md:col-span-3">
            <KpiBlock
              icon={Eye}
              label="Total views"
              value={formatNumber(summary.views)}
              hint="Across all media"
            />
          </Widget>

          {/* Widget 4 — Positive share */}
          <Widget className="col-span-12 md:col-span-4">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Positive share</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <span
                  className={`text-5xl font-semibold tracking-tight ${
                    summary.positiveShare >= 50 ? "text-success" : "text-destructive"
                  }`}
                >
                  {summary.positiveShare}%
                </span>
                <p className="mt-2 text-xs text-muted-foreground">
                  {summary.positiveShare >= 50
                    ? "Above benchmark — favorable coverage."
                    : "Below benchmark — investigate negative drivers."}
                </p>
              </div>
            </div>
          </Widget>

          {/* Widget 5 — Sentiment donut */}
          <Widget className="col-span-12 md:col-span-3 row-span-2 overflow-visible">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Sentiment</span>
              </div>
              <div className="relative mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={sentimentData}
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sentimentData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold leading-none">{summary.count}</span>
                  <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    items
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px]">
                {sentimentData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: d.color }}
                    />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>
          </Widget>

          {/* Widget 6 — Word cloud (wider) */}
          <Widget className="col-span-12 md:col-span-7 row-span-2">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Word cloud</span>
                <span className="font-normal normal-case">Most frequent terms</span>
              </div>
              <div className="-mx-2 mt-2 flex-1 overflow-hidden">
                <WordCloud text={wordSource} />
              </div>
            </div>
          </Widget>

          {/* Widget 7 — Top 5 */}
          <Widget className="col-span-12 md:col-span-5 row-span-2">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Top 5 publications</span>
                <FileText className="h-4 w-4" />
              </div>
              <ol className="mt-3 space-y-2">
                {topFive.map((p, i) => (
                  <li key={p.id}>
                    <button
                      onClick={() => navigate({ to: "/publications/$pubId", params: { pubId: p.id } })}
                      className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition hover:border-border hover:bg-muted/40"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.source}</p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" /> {formatPrei(p.prei)}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </Widget>
        </div>

        {/* Publications */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Publications in this report
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {report.publications.length}
              </span>
            </h2>
          </div>
          <div className="-mx-2 mt-4 flex gap-4 overflow-x-auto px-2 pb-4">
            {report.publications.map((p) => (
              <PublicationCard key={p.id} pub={p} onOpen={() => navigate({ to: "/publications/$pubId", params: { pubId: p.id } })} />
            ))}
          </div>
        </div>
      </div>

      <ExportDialog
        open={openExport}
        onOpenChange={setOpenExport}
        reportName={report.name}
        onExport={(format) => {
          saveDraft({
            reportId: report.id,
            reportName: report.name,
            clientName: report.clientName,
            format,
          });
        }}
      />
    </div>
  );
}

function Widget({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 transition hover:shadow-[var(--shadow-elegant)] ${className}`}
    >
      {children}
    </div>
  );
}

function KpiBlock({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <span className="text-4xl font-semibold tracking-tight">{value}</span>
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function ExportDialog({
  open,
  onOpenChange,
  reportName,
  onExport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reportName: string;
  onExport: (format: "PDF" | "Workspace") => void;
}) {
  function handleStandard(format: "PDF" | "Workspace") {
    onExport(format);
    toast.success(
      format === "PDF" ? "PDF downloaded · saved to Drafts" : "Saved to workspace · added to Drafts",
    );
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Export report</DialogTitle>
          <DialogDescription>Choose how you'd like to ship "{reportName}".</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-xl border border-border p-5 transition hover:border-primary hover:bg-primary/[0.03]">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                Recommended
              </span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-base font-semibold">Standard report</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Default ProntoPR branding · white, black, pink accents.
              </p>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <Button size="sm" className="w-full" onClick={() => handleStandard("PDF")}>
                Download PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleStandard("Workspace")}
              >
                Save to Workspace
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Every export is auto-saved to Drafts.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Coming soon
              </span>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-base font-semibold">Custom report</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Cover selection, templates, corporate colors, logos and full brand identity.
              </p>
            </div>
            <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
              <li>· Cover selection</li>
              <li>· Templates</li>
              <li>· Corporate colors</li>
              <li>· Logos & brand identity</li>
            </ul>
            <Button disabled variant="outline" className="mt-2 w-fit">
              Configure branding
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

