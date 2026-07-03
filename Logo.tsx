import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/workspace" className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
        <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-semibold tracking-tight">
        Pronto<span className="text-primary">PR</span>
      </span>
    </Link>
  );
}
