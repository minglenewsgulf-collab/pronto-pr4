import { useMemo } from "react";

interface Props {
  text: string;
}

const STOP = new Set([
  "the","a","an","and","or","but","of","in","on","for","to","with","by","from","at","is",
  "are","was","were","be","been","being","this","that","these","those","it","its","as",
  "has","have","had","not","no","so","than","then","into","over","about","after","new",
  "we","you","they","he","she","our","their","his","her","more","most","up","down","out",
  "via","amid","while","when","where","which","who","what","why","how","also","just",
]);

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(Math.sin(h) * 10000) % 1;
}

export function WordCloud({ text }: Props) {
  const words = useMemo(() => {
    const counts = new Map<string, number>();
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w))
      .forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 32);
  }, [text]);

  if (words.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Not enough text to build a word cloud yet.
      </div>
    );
  }

  const max = words[0][1];
  const min = words[words.length - 1][1];

  return (
    <div className="flex h-full min-h-[240px] w-full items-center justify-center overflow-hidden bg-card px-2 py-3">
      <div className="flex max-w-full flex-wrap items-baseline justify-center gap-x-4 gap-y-2 text-center leading-tight">
        {words.map(([word, count], i) => {
          const t = (count - min) / Math.max(1, max - min);
          // Discrete tiers prevent overlap and keep readability
          const size = t > 0.8 ? 44 : t > 0.6 ? 34 : t > 0.4 ? 26 : t > 0.2 ? 20 : 15;
          const weight = t > 0.6 ? 800 : t > 0.3 ? 600 : 500;

          // Color palette: pink (primary), black (foreground), gray tones
          let colorClass: string;
          const r = seededRandom(word);
          if (t > 0.6) {
            colorClass = i % 2 === 0 ? "text-primary" : "text-foreground";
          } else if (t > 0.3) {
            colorClass = r > 0.7 ? "text-primary" : "text-foreground";
          } else {
            colorClass = "text-muted-foreground";
          }

          return (
            <span
              key={word}
              style={{
                fontSize: `${size}px`,
                fontWeight: weight,
                lineHeight: 1.1,
              }}
              className={`inline-block whitespace-nowrap tracking-tight ${colorClass}`}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
