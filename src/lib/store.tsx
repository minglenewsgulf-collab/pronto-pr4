import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { getSession, signInWithEmail, signOut, signUpWithEmail } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import {
  createReportInSupabase,
  deleteExportFromSupabase,
  deleteReportFromSupabase,
  loadExportsAsDraftsFromSupabase,
  loadReportsFromSupabase,
  updateReportInSupabase,
} from "@/lib/data/supabaseAppData";
import type { Publication, Report, User, Sentiment, Draft } from "./types";

export interface WorkspaceState {
  urlsText: string;
  pubs: Publication[];
  reportId: string | null;
}

interface AppState {
  user: User | null;
  hydrated: boolean;
  reports: Report[];
  drafts: Draft[];
  workspace: WorkspaceState;
  setWorkspace: (patch: Partial<WorkspaceState>) => void;
  resetWorkspace: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (u: User, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createReport: (r: Omit<Report, "id" | "createdAt">) => Promise<Report>;
  updateReport: (id: string, patch: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  getReport: (id: string) => Report | undefined;
  findPublication: (pubId: string) => { pub: Publication; report: Report } | undefined;
  updatePublication: (reportId: string, pubId: string, patch: Partial<Publication>) => void;
  saveDraft: (d: Omit<Draft, "id" | "createdAt">) => Draft;
  deleteDraft: (id: string) => void;
}

const Ctx = createContext<AppState | null>(null);

function userFromAuth(authUser: AuthUser | null): User | null {
  if (!authUser?.email) return null;

  const metadata = authUser.user_metadata ?? {};
  const emailName = authUser.email.split("@")[0] || "PR";

  return {
    firstName: typeof metadata.first_name === "string" ? metadata.first_name : emailName,
    lastName: typeof metadata.last_name === "string" ? metadata.last_name : "Specialist",
    email: authUser.email,
    company: typeof metadata.company === "string" ? metadata.company : undefined,
    jobTitle: typeof metadata.job_title === "string" ? metadata.job_title : undefined,
    phone: typeof metadata.phone === "string" ? metadata.phone : undefined,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [workspace, setWorkspaceState] = useState<WorkspaceState>({
    urlsText: "",
    pubs: [],
    reportId: null,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function loadBackendData() {
      const loadedReports = await loadReportsFromSupabase();
      const migrated = loadedReports.map((r) => ({
        ...r,
        publications: r.publications.map((p) =>
          p.prei > 10 ? { ...p, prei: Math.round((p.prei / 10) * 10) / 10 } : p,
        ),
      }));
      setReports(migrated);
      setDrafts(await loadExportsAsDraftsFromSupabase(migrated));
    }

    async function hydrateAuth() {
      try {
        const { data, error } = await getSession();
        if (error) throw error;
        setUser(userFromAuth(data?.user ?? null));
        if (data?.user) {
          await loadBackendData();
        } else {
          setReports([]);
          setDrafts([]);
        }

        const { data: listener } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
          setUser(userFromAuth(session?.user ?? null));
          if (session?.user) {
            void loadBackendData().catch((error) => console.error(error));
          } else {
            setReports([]);
            setDrafts([]);
            resetWorkspaceState();
          }
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setHydrated(true);
      }
    }

    void hydrateAuth();

    return () => unsubscribe?.();
  }, []);

  function resetWorkspaceState() {
    setWorkspaceState({ urlsText: "", pubs: [], reportId: null });
  }

  const value: AppState = {
    user,
    hydrated,
    reports,
    drafts,
    workspace,
    setWorkspace: (patch) => setWorkspaceState((prev) => ({ ...prev, ...patch })),
    resetWorkspace: () => setWorkspaceState({ urlsText: "", pubs: [], reportId: null }),
    login: async (email, password) => {
      const { data, error } = await signInWithEmail({ email, password });
      if (error) throw error;
      setUser(userFromAuth(data?.user ?? null));
      const loadedReports = await loadReportsFromSupabase();
      setReports(loadedReports);
      setDrafts(await loadExportsAsDraftsFromSupabase(loadedReports));
    },
    register: async (u, password) => {
      const { data, error } = await signUpWithEmail({
        email: u.email,
        password,
        firstName: u.firstName,
        lastName: u.lastName,
        company: u.company,
        jobTitle: u.jobTitle,
        phone: u.phone,
      });
      if (error) throw error;
      setUser(userFromAuth(data?.user ?? null));
      if (data?.user) {
        const loadedReports = await loadReportsFromSupabase();
        setReports(loadedReports);
        setDrafts(await loadExportsAsDraftsFromSupabase(loadedReports));
      }
    },
    logout: async () => {
      const { error } = await signOut();
      if (error) throw error;
      setUser(null);
      setReports([]);
      setDrafts([]);
      resetWorkspaceState();
    },
    createReport: async (r) => {
      const report = await createReportInSupabase(r);
      setReports((prev) => [report, ...prev]);
      return report;
    },
    updateReport: (id, patch) =>
      setReports((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
        const updated = next.find((r) => r.id === id);
        if (updated) void updateReportInSupabase(updated).catch((error) => console.error(error));
        return next;
      }),
    deleteReport: (id) => {
      setReports((prev) => prev.filter((r) => r.id !== id));
      void deleteReportFromSupabase(id).catch((error) => console.error(error));
    },
    getReport: (id) => reports.find((r) => r.id === id),
    findPublication: (pubId) => {
      for (const r of reports) {
        const pub = r.publications.find((p) => p.id === pubId);
        if (pub) return { pub, report: r };
      }
      return undefined;
    },
    updatePublication: (reportId, pubId, patch) =>
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                publications: r.publications.map((p) =>
                  p.id === pubId ? { ...p, ...patch } : p,
                ),
              }
            : r,
        ),
      ),
    saveDraft: (d) => {
      const draft: Draft = { ...d, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      setDrafts((prev) => [draft, ...prev]);
      void loadExportsAsDraftsFromSupabase(reports)
        .then(setDrafts)
        .catch((error) => console.error(error));
      return draft;
    },
    deleteDraft: (id) => {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      void deleteExportFromSupabase(id).catch((error) => console.error(error));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

// --- analysis helpers ---------------------------------------------------------

const SENTIMENTS: Sentiment[] = ["positive", "positive", "positive", "neutral", "neutral", "negative"];
const PLACEMENTS: Publication["placement"][] = ["Homepage", "Section front", "Article", "Mention"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554178286-db408c69256a?w=800&auto=format&fit=crop",
];

const TITLE_FRAGMENTS = [
  "How {Brand} is reshaping the industry",
  "{Brand} announces breakthrough partnership",
  "Inside the launch of {Brand}'s new platform",
  "{Brand} sees record growth this quarter",
  "Why analysts are watching {Brand} closely",
  "{Brand} unveils next-generation product line",
  "{Brand} expands into European markets",
  "The vision behind {Brand}'s rebrand",
];

export function analyzeUrls(urls: string[], clientName: string): Publication[] {
  return urls.map((url, i) => {
    const seed = hash(url + i);
    const r = rng(seed);
    const source = safeHost(url);
    const titleTemplate = TITLE_FRAGMENTS[seed % TITLE_FRAGMENTS.length];
    const title = titleTemplate.replace("{Brand}", clientName || source);
    const reach = Math.round(20000 + r() * 480000);
    const views = Math.round(reach * (0.05 + r() * 0.4));
    const prei = Math.round((5.5 + r() * 4) * 10) / 10;
    const sentiment = SENTIMENTS[Math.floor(r() * SENTIMENTS.length)];
    const mediaAuthority = Math.round(45 + r() * 55);
    const placement = PLACEMENTS[Math.floor(r() * PLACEMENTS.length)];
    const influence = Math.round(40 + r() * 60);
    return {
      id: crypto.randomUUID(),
      url,
      title,
      source,
      previewImage: STOCK_IMAGES[seed % STOCK_IMAGES.length],
      reach,
      views,
      prei,
      sentiment,
      publishedAt: new Date(Date.now() - Math.floor(r() * 30) * 86400000).toISOString(),
      excerpt:
        "Coverage highlights the strategic momentum, product positioning, and market response surrounding the announcement.",
      mediaAuthority,
      placement,
      influence,
      hasBacklink: r() > 0.3,
      republications: Math.floor(r() * 6),
      brandSearchLift: r() > 0.4,
      trendsGrowth: r() > 0.6,
    };
  });
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "publication.com";
  }
}

export function aggregate(pubs: Publication[]) {
  const total = pubs.length || 1;
  const reach = pubs.reduce((a, p) => a + p.reach, 0);
  const views = pubs.reduce((a, p) => a + p.views, 0);
  const prei = pubs.length ? pubs.reduce((a, p) => a + p.prei, 0) / total : 0;
  const positive = pubs.filter((p) => p.sentiment === "positive").length;
  const neutral = pubs.filter((p) => p.sentiment === "neutral").length;
  const negative = pubs.filter((p) => p.sentiment === "negative").length;
  return {
    count: pubs.length,
    reach,
    views,
    prei: Math.round(prei * 10) / 10,
    positiveShare: pubs.length ? Math.round((positive / pubs.length) * 100) : 0,
    sentiment: { positive, neutral, negative },
  };
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function preiInterpretation(prei: number) {
  if (prei >= 8.5) return { label: "Excellent PR Impact", tone: "success" as const };
  if (prei >= 7.0) return { label: "Strong PR Impact", tone: "success" as const };
  if (prei >= 5.0) return { label: "Moderate PR Impact", tone: "warning" as const };
  if (prei >= 3.0) return { label: "Low PR Impact", tone: "destructive" as const };
  return { label: "Minimal PR Impact", tone: "destructive" as const };
}

export function formatPrei(prei: number): string {
  return (Math.round(prei * 10) / 10).toFixed(1);
}
