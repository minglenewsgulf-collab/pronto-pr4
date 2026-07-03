import type { Publication } from "@/lib/types";
import { Eye, Radio, Sparkles, X } from "lucide-react";
import { formatNumber, formatPrei } from "@/lib/store";

interface Props {
  pub: Publication;
  onOpen?: () => void;
  onDelete?: () => void;
}

const sentimentStyles: Record<Publication["sentiment"], string> = {
  positive: "bg-success/15 text-success",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-destructive/15 text-destructive",
};

export function PublicationCard({ pub, onOpen, onDelete }: Props) {
  return (
    <div className="group relative flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-[var(--shadow-elegant)]">
      {onDelete && (
        <button
          aria-label="Remove publication"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow transition group-hover:opacity-100 hover:bg-background"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <button onClick={onOpen} className="block text-left">
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={pub.previewImage}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {pub.source}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${sentimentStyles[pub.sentiment]}`}
            >
              {pub.sentiment}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {pub.title}
          </h3>
          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5" title="Reach">
              <Radio className="h-3.5 w-3.5" />
              {formatNumber(pub.reach)}
            </span>
            <span className="flex items-center gap-1.5" title="Views">
              <Eye className="h-3.5 w-3.5" />
              {formatNumber(pub.views)}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-primary" title="PREI">
              <Sparkles className="h-3.5 w-3.5" />
              {formatPrei(pub.prei)}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
