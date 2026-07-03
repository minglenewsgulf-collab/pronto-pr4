import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PublicationCard } from "@/components/PublicationCard";

import { useApp, analyzeUrls, aggregate, formatNumber, formatPrei } from "@/lib/store";
import type { Publication } from "@/lib/types";
import { toast } from "sonner";
import {
  Paperclip,
  Sparkles,
  Calendar as CalendarIcon,
  ArrowRight,
  Radio,
  Eye,
  FileText,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/workspace")({
  head: () => ({
    meta: [{ title: "Workspace · ProntoPR" }],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { createReport, updateReport, workspace, setWorkspace } = useApp();
  const navigate = useNavigate();

  const { urlsText, pubs, reportId } = workspace;
  const setUrlsText = (v: string) => setWorkspace({ urlsText: v });
  const setPubs = (v: Publication[]) => setWorkspace({ pubs: v });

  const [openMeta, setOpenMeta] = useState(false);

  // Meta form
  const [meta, setMeta] = useState({
    name: "",
    client: "",
    project: "",
    range: undefined as DateRange | undefined,
  });

  const summary = useMemo(() => aggregate(pubs), [pubs]);

  const parsedUrls = useMemo(
    () =>
      urlsText
        .split(/\s+/)
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s)),
    [urlsText],
  );

  function handleCalculate() {
    if (parsedUrls.length === 0) {
      toast.error("Add at least one URL to analyze");
      return;
    }
    setOpenMeta(true);
  }

  function handleConfirmMeta() {
    if (!meta.name || !meta.client || !meta.project || !meta.range?.from || !meta.range?.to) {
      toast.error("Please complete every field");
      return;
    }
    const analyzed = analyzeUrls(parsedUrls, meta.client);
    const report = createReport({
      name: meta.name,
      clientName: meta.client,
      projectName: meta.project,
      startDate: meta.range.from.toISOString(),
      endDate: meta.range.to.toISOString(),
      publications: analyzed,
      folder: "reports",
    });
    setWorkspace({ pubs: analyzed, reportId: report.id, urlsText: "" });
    setOpenMeta(false);
    toast.success("PREI calculated for " + analyzed.length + " publications");
  }

  function handleRemove(id: string) {
    const next = pubs.filter((p) => p.id !== id);
    setPubs(next);
    if (reportId) updateReport(reportId, { publications: next });
  }




  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              New report
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Upload links and files
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Paste publication URLs or attach files. ProntoPR will calculate reach, views and the
              PR Effectiveness Index for each item, then assemble a campaign-level report.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main */}
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <Label htmlFor="urls" className="text-sm font-medium">
                Publication URLs
              </Label>
              <Textarea
                id="urls"
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder={"https://techcrunch.com/...\nhttps://forbes.com/...\nhttps://reuters.com/..."}
                className="mt-3 min-h-[200px] resize-y border-border bg-background font-mono text-sm"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{parsedUrls.length} URL{parsedUrls.length === 1 ? "" : "s"} detected</span>
                <span>One URL per line. Paste batches of any size.</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Paperclip className="h-4 w-4" /> Attach files
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  PDF · screenshots · print
                </span>
              </Button>
              <div className="flex-1" />
              <Button onClick={handleCalculate} className="h-11 gap-2 px-6 text-sm font-medium">
                <Sparkles className="h-4 w-4" /> Calculate PREI
              </Button>
            </div>

            {pubs.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Publications
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {pubs.length} analyzed
                    </span>
                  </h2>
                  {reportId && (
                    <Button
                      onClick={() => navigate({ to: "/reports/$reportId", params: { reportId } })}
                      className="gap-2"
                    >
                      Go to report <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-4">
                  {pubs.map((p) => (
                    <PublicationCard
                      key={p.id}
                      pub={p}
                      onOpen={() => navigate({ to: "/publications/$pubId", params: { pubId: p.id } })}
                      onDelete={() => handleRemove(p.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Right summary */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Preliminary summary</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  Live
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-updates as you analyze publications.
              </p>

              <div className="mt-5 space-y-4">
                <SummaryRow
                  icon={FileText}
                  label="Publications"
                  value={summary.count.toString()}
                />
                <SummaryRow icon={Radio} label="Total reach" value={formatNumber(summary.reach)} />
                <SummaryRow icon={Eye} label="Total views" value={formatNumber(summary.views)} />
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Campaign PREI
                  </p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-3xl font-semibold tracking-tight">
                      {summary.prei ? formatPrei(summary.prei) : "—"}
                    </span>
                    <span className="pb-1 text-xs text-muted-foreground">/ 10</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {assessment(summary.prei)}
                  </p>
                </div>
                <SummaryRow
                  icon={TrendingUp}
                  label="Positive share"
                  value={summary.count ? `${summary.positiveShare}%` : "—"}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border p-5 text-xs text-muted-foreground">
              Need help interpreting PREI?{" "}
              <a href="#" className="font-medium text-primary hover:underline">
                Read the methodology →
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* Meta modal */}
      <Dialog open={openMeta} onOpenChange={setOpenMeta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Report name</Label>
              <Input
                value={meta.name}
                onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                placeholder="Q4 product launch coverage"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Input
                  value={meta.client}
                  onChange={(e) => setMeta({ ...meta, client: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Input
                  value={meta.project}
                  onChange={(e) => setMeta({ ...meta, project: e.target.value })}
                  placeholder="Launch campaign"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Analysis period</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start gap-2 font-normal",
                      !meta.range?.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {meta.range?.from ? (
                      meta.range.to ? (
                        <>
                          {format(meta.range.from, "MMM d, yyyy")} —{" "}
                          {format(meta.range.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(meta.range.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={meta.range}
                    onSelect={(r) => setMeta({ ...meta, range: r })}
                    numberOfMonths={2}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenMeta(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMeta}>Calculate PREI</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function assessment(prei: number) {
  if (!prei) return "Add publications to compute an assessment.";
  if (prei >= 8.5) return "Outstanding campaign performance.";
  if (prei >= 7.0) return "Strong, on-message coverage.";
  if (prei >= 5.0) return "Solid performance with room to grow.";
  return "Underperforming — review messaging and outlet mix.";
}
