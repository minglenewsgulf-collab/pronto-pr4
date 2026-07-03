import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useApp, aggregate, formatPrei } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Sparkles, Trash2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/reports/")({
  head: () => ({ meta: [{ title: "Reports · ProntoPR" }] }),
  component: ReportsList,
});

function ReportsList() {
  const { reports, deleteReport } = useApp();
  const navigate = useNavigate();
  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Every PREI report you've created.
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate({ to: "/workspace" })}>
            <Plus className="h-4 w-4" /> New report
          </Button>
        </div>

        {reports.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Pubs</th>
                  <th className="px-5 py-3 font-medium">PREI</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => {
                  const s = aggregate(r.publications);
                  return (
                    <tr key={r.id} className="transition hover:bg-muted/30">
                      <td className="px-5 py-4 font-medium">
                        <Link
                          to="/reports/$reportId"
                          params={{ reportId: r.id }}
                          className="hover:text-primary"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{r.clientName}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {format(new Date(r.startDate), "MMM d")} —{" "}
                        {format(new Date(r.endDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-5 py-4 tabular-nums">{s.count}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <Sparkles className="h-3.5 w-3.5" /> {formatPrei(s.prei)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteReport(r.id)}
                          aria-label="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Head to the workspace to drop in publication URLs and create your first PREI report.
      </p>
      <Link
        to="/workspace"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> Create report
      </Link>
    </div>
  );
}
