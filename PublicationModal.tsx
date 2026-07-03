import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Publication } from "@/lib/types";
import { formatPrei } from "@/lib/store";
import { Sparkles } from "lucide-react";

interface Props {
  pub: Publication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<Publication>) => void;
}

export function PublicationModal({ pub, open, onOpenChange, onSave }: Props) {
  const [reach, setReach] = useState(0);
  const [views, setViews] = useState(0);
  const [reachEdited, setReachEdited] = useState(false);
  const [viewsEdited, setViewsEdited] = useState(false);

  useEffect(() => {
    if (pub) {
      setReach(pub.reach);
      setViews(pub.views);
      setReachEdited(pub.reachEdited ?? false);
      setViewsEdited(pub.viewsEdited ?? false);
    }
  }, [pub]);

  if (!pub) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Publication details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div className="overflow-hidden rounded-lg border border-border">
            <img src={pub.previewImage} alt="" className="aspect-square w-full object-cover" />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {pub.source} · {new Date(pub.publishedAt).toLocaleDateString()}
            </p>
            <h3 className="text-lg font-semibold leading-snug">{pub.title}</h3>
            <p className="text-sm text-muted-foreground">{pub.excerpt}</p>
            <a
              href={pub.url}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-xs text-primary hover:underline"
            >
              {pub.url}
            </a>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-3">
          <MetricField
            id="reach"
            label="Reach"
            value={reach}
            edited={reachEdited}
            onChange={(v) => {
              setReach(v);
              setReachEdited(true);
            }}
          />
          <MetricField
            id="views"
            label="Views"
            value={views}
            edited={viewsEdited}
            onChange={(v) => {
              setViews(v);
              setViewsEdited(true);
            }}
          />
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              PREI score
            </Label>
            <div className="mt-2 flex items-baseline gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-2xl font-semibold">{formatPrei(pub.prei)}</span>
              <span className="text-xs text-muted-foreground">/ 10</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Read-only — derived from publication signals</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onSave({ reach, views, reachEdited, viewsEdited });
              onOpenChange(false);
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetricField({
  id,
  label,
  value,
  edited,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  edited: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <Label htmlFor={id} className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-9 border-0 px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
      />
      <p
        className={`text-[11px] ${edited ? "font-medium text-primary" : "text-muted-foreground"}`}
      >
        {edited ? "Value adjusted by the user" : "Value determined by the system"}
      </p>
    </div>
  );
}
