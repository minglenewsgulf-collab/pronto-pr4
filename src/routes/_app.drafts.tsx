import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { FileEdit, Download, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/drafts")({
  head: () => ({ meta: [{ title: "Drafts · ProntoPR" }] }),
  component: DraftsPage,
});

function DraftsPage() {
  const { drafts, deleteDraft } = useApp();
  const navigate = useNavigate();

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Drafts</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Every exported report is auto-saved here so you can revisit and tweak it later.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => navigate({ to: "/reports" })}>
            <FileText className="h-4 w-4" /> View reports
          </Button>
        </div>

        {drafts.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileEdit className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No drafts yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Export any report and a draft copy will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Report</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Exported</th>
                  <th className="px-5 py-3 font-medium">Format</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drafts.map((d) => (
                  <tr key={d.id} className="transition hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium">
                      <Link
                        to="/reports/$reportId"
                        params={{ reportId: d.reportId }}
                        className="hover:text-primary"
                      >
                        {d.reportName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{d.clientName}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {format(new Date(d.createdAt), "MMM d, yyyy · HH:mm")}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Download className="h-3 w-3" /> {d.format}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteDraft(d.id)}
                        aria-label="Delete draft"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
