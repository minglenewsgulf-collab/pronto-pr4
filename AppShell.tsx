import { Link, useRouterState, Outlet, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  FolderKanban,
  Megaphone,
  FileEdit,
  Plus,
  Search,
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";

const NAV = [
  { to: "/workspace", label: "Workspace", icon: Sparkles },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/drafts", label: "Drafts", icon: FileEdit },
] as const;

export function AppShell() {
  const { user, logout, reports } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : "U";

  const recentReports = reports.slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
        <div className="flex items-center gap-8">
          <Logo />
        </div>

        <div className="hidden flex-1 items-center justify-center px-12 md:flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports, campaigns, publications…"
              className="h-9 border-border bg-muted/40 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-xs font-medium text-muted-foreground md:inline-flex"
          >
            Upgrade plan
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background transition hover:opacity-90">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span className="font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" /> Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-6 md:flex">
          <Button
            onClick={() => navigate({ to: "/workspace" })}
            className="mb-6 h-9 w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New report
          </Button>

          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {recentReports.length > 0 && (
            <div className="mt-8">
              <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recent
              </p>
              <div className="mt-2 space-y-0.5">
                {recentReports.map((r) => (
                  <Link
                    key={r.id}
                    to="/reports/$reportId"
                    params={{ reportId: r.id }}
                    className="block truncate rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-background px-8 py-10 text-xs text-muted-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs">
            PR Effectiveness Index — measurable insight for modern communications teams.
          </p>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground">Support</p>
          <p>support@prontopr.app</p>
          <p>Mon–Fri · 9:00–18:00</p>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground">Legal</p>
          <p className="hover:text-foreground"><a href="#">Privacy Policy</a></p>
          <p className="hover:text-foreground"><a href="#">Terms of Service</a></p>
          <p className="hover:text-foreground"><a href="#">Pricing</a></p>
        </div>
        <div>
          <p className="mb-2 font-medium text-foreground">Newsletter</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <Input
              type="email"
              placeholder="you@company.com"
              className="h-8 border-border bg-background text-xs"
            />
            <Button size="sm" className="h-8 bg-foreground text-background hover:bg-foreground/90">
              Join
            </Button>
          </form>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-border pt-4 text-[11px]">
        © {new Date().getFullYear()} ProntoPR. All rights reserved.
      </div>
    </footer>
  );
}
