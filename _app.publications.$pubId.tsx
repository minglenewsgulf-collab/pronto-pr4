import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useApp, formatNumber, formatPrei, preiInterpretation } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  Radio,
  Eye,
  Building2,
  MapPin,
  Smile,
  Zap,
  Sparkles,
  Check,
  Circle,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/publications/$pubId")({
  head: () => ({ meta: [{ title: "Publication · ProntoPR" }] }),
  component: PublicationDetailPage,
});

function PublicationDetailPage() {
  const { pubId } = Route.useParams();
  const { findPublication, updatePublication } = useApp();
  const navigate = useNavigate();
  const found = findPublication(pubId);

  const [editing, setEditing] = useState(false);
  const [reach, setReach] = useState(found?.pub.reach ?? 0);
  const [views, setViews] = useState(found?.pub.views ?? 0);

  if (!found) {
    return (
      <div className="px-8 py-20 text-center">
        <h2 className="text-xl font-semibold">Publication not found</h2>
        <Button className="mt-6" onClick={() => navigate({ to: "/reports" })}>
          Back to reports
        </Button>
      </div>
    );
  }

  const { pub, report } = found;
  const interp = preiInterpretation(pub.prei);

  const positiveSignals = [
    pub.brandSearchLift && "Brand Search Visibility",
    pub.hasBacklink && "Website Link Included",
    (pub.placement === "Homepage" || pub.placement === "Section front") && "Strong Placement",
    pub.republications && pub.republications > 1 ? "Republications Detected" : null,
  ].filter(Boolean) as string[];

  const missingSignals = [
    !pub.trendsGrowth && "No Google Trends Growth",
    (!pub.republications || pub.republications < 2) && "Limited Secondary Mentions",
    !pub.hasBacklink && "No Backlink Detected",
  ].filter(Boolean) as string[];

  const drivers: { label: string; positive: boolean }[] = [
    { label: `Media authority: ${pub.mediaAuthority}/100`, positive: (pub.mediaAuthority ?? 0) >= 65 },
    { label: `${pub.placement} placement`, positive: pub.placement === "Homepage" || pub.placement === "Section front" },
    { label: `${pub.sentiment[0].toUpperCase() + pub.sentiment.slice(1)} sentiment`, positive: pub.sentiment === "positive" },
    { label: `Audience reach ${formatNumber(pub.reach)}`, positive: pub.reach > 100000 },
    { label: `Influence signal: ${pub.influence}/100`, positive: (pub.influence ?? 0) >= 60 },
  ];

  function handleSave() {
    updatePublication(report.id, pub.id, { reach, views, reachEdited: true, viewsEdited: true });
    setEditing(false);
    toast.success("Publication updated");
  }

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/workspace"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Publications
            </Link>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight">
              {pub.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{pub.source}</span>
              <span>{format(new Date(pub.publishedAt), "MMM d, yyyy")}</span>
              <a
                href={pub.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 truncate text-primary hover:underline"
              >
                {pub.url}
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2">
              <a href={pub.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open Original Source
              </a>
            </Button>
          </div>
        </div>

        {/* PREI Hero */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>PREI Score</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-8xl font-semibold tracking-tight leading-none">{formatPrei(pub.prei)}</span>
              <span className="pb-4 text-base text-muted-foreground">/ 10</span>
            </div>
            <p
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                interp.tone === "success"
                  ? "bg-success/15 text-success"
                  : interp.tone === "warning"
                    ? "bg-warning/15 text-warning-foreground"
                    : "bg-destructive/15 text-destructive"
              }`}
            >
              {interp.label}
            </p>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, pub.prei * 10)}%` }}
              />
            </div>
          </div>

          {/* AI Insights */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.06] to-card p-8">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>AI Insights</span>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-4 text-base leading-relaxed text-foreground">
              This publication generated{" "}
              <span className="font-semibold">
                {pub.reach > 200000 ? "strong visibility" : "moderate visibility"}
              </span>{" "}
              due to {pub.placement?.toLowerCase()} placement and{" "}
              {(pub.mediaAuthority ?? 0) >= 65 ? "high" : "moderate"} media authority.{" "}
              {pub.sentiment === "positive"
                ? "Positive sentiment contributed favorably to campaign performance."
                : pub.sentiment === "neutral"
                  ? "Neutral tone offered balanced narrative exposure."
                  : "Negative sentiment may require reactive messaging."}
            </p>
          </div>
        </div>

        {/* KPI grid */}
        <h2 className="mt-12 text-lg font-semibold tracking-tight">Key metrics</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard icon={Radio} label="Reach" value={formatNumber(pub.reach)} />
          <KpiCard icon={Eye} label="Views" value={formatNumber(pub.views)} />
          <KpiCard
            icon={Building2}
            label="Media Authority"
            value={`${pub.mediaAuthority}`}
            suffix="/100"
            progress={pub.mediaAuthority}
          />
          <KpiCard icon={MapPin} label="Placement" value={pub.placement ?? "—"} />
          <KpiCard
            icon={Smile}
            label="Tone"
            value={pub.sentiment[0].toUpperCase() + pub.sentiment.slice(1)}
            tone={
              pub.sentiment === "positive"
                ? "success"
                : pub.sentiment === "negative"
                  ? "destructive"
                  : "muted"
            }
          />
          <KpiCard
            icon={Zap}
            label="Influence Score"
            value={`${pub.influence}`}
            suffix="/100"
            progress={pub.influence}
          />
        </div>

        {/* Editable reach/views */}
        <div className="mt-6 flex items-center justify-end">
          {editing ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Reach
                <Input
                  type="number"
                  value={reach}
                  onChange={(e) => setReach(Number(e.target.value))}
                  className="h-8 w-28"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Views
                <Input
                  type="number"
                  value={views}
                  onChange={(e) => setViews(Number(e.target.value))}
                  className="h-8 w-28"
                />
              </label>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Adjust reach / views
            </Button>
          )}
        </div>

        {/* Impact Signals */}
        <h2 className="mt-10 text-lg font-semibold tracking-tight">Impact signals</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-success">
              Positive signals
            </p>
            <ul className="mt-4 space-y-3">
              {positiveSignals.length === 0 && (
                <li className="text-sm text-muted-foreground">No positive signals detected.</li>
              )}
              {positiveSignals.map((s) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Missing signals
            </p>
            <ul className="mt-4 space-y-3">
              {missingSignals.length === 0 && (
                <li className="text-sm text-muted-foreground">All key signals present.</li>
              )}
              {missingSignals.map((s) => (
                <li key={s} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                    <Circle className="h-3 w-3" />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* PREI Drivers */}
        <h2 className="mt-10 text-lg font-semibold tracking-tight">What influenced this score</h2>
        <div className="mt-4 rounded-2xl border border-border bg-card p-6">
          <ul className="grid gap-3 md:grid-cols-2">
            {drivers.map((d) => (
              <li
                key={d.label}
                className={`flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm ${
                  d.positive ? "bg-success/[0.05]" : "bg-muted/30"
                }`}
              >
                <span>{d.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    d.positive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {d.positive ? "Boosting" : "Limiting"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Methodology */}
        <h2 className="mt-10 text-lg font-semibold tracking-tight">Methodology</h2>
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          <p className="text-foreground">
            PREI considers a curated set of indicators to express the overall impact of a
            publication on a single 0–100 scale:
          </p>
          <ul className="mt-4 grid gap-2 md:grid-cols-5">
            {["Reach", "Media Authority", "Placement Quality", "Sentiment", "Influence Signals"].map(
              (m) => (
                <li
                  key={m}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center text-xs font-medium text-foreground"
                >
                  {m}
                </li>
              ),
            )}
          </ul>
          <p className="mt-4">
            Each factor reflects a different dimension of publication impact — combined into a
            single 0–100 score for at-a-glance comparison across coverage.
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  progress,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: string;
  progress?: number;
  tone?: "success" | "destructive" | "muted";
}) {
  const valueClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-3 flex items-end gap-1">
        <span className={`text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</span>
        {suffix && <span className="pb-1 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
