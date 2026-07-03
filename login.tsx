import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · ProntoPR" },
      { name: "description", content: "Sign in or create a ProntoPR account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, hydrated, login, register } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [openRegister, setOpenRegister] = useState(false);

  useEffect(() => {
    if (hydrated && user) navigate({ to: "/workspace" });
  }, [user, hydrated, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-6">
        <Logo />
        <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
          Need help?
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              PR Effectiveness Index
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              Measure the impact of every publication, in one workspace.
            </h1>
            <p className="max-w-md text-base text-muted-foreground">
              ProntoPR turns raw media coverage into a single trusted score — PREI — and
              auto-generates campaign reports for clients, agencies and in-house teams.
            </p>
            <div className="flex gap-6 pt-4 text-sm text-muted-foreground">
              <Stat label="Reports generated" value="24,800+" />
              <Stat label="Avg. setup" value="< 2 min" />
              <Stat label="Teams" value="Agencies · Brands" />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back. Enter your credentials to continue.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email) return toast.error("Email is required");
                login(email, password);
                toast.success("Signed in");
                navigate({ to: "/workspace" });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => toast("Password reset link sent (placeholder)")}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="h-11 w-full text-sm font-medium">
                Sign in <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              New to ProntoPR?
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="outline"
              className="mt-4 h-11 w-full text-sm font-medium"
              onClick={() => setOpenRegister(true)}
            >
              Create an account
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-8 py-6 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} ProntoPR</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Pricing</a>
            <a href="mailto:support@prontopr.app" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </footer>

      <RegisterModal
        open={openRegister}
        onOpenChange={setOpenRegister}
        onComplete={(u) => {
          register(u);
          toast.success("Welcome to ProntoPR");
          navigate({ to: "/workspace" });
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs">{label}</p>
    </div>
  );
}

function RegisterModal({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete: (u: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    jobTitle: string;
    phone?: string;
  }) => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    email: "",
    phone: "",
  });
  const [consent, setConsent] = useState(false);

  const required = form.firstName && form.lastName && form.company && form.jobTitle && form.email;
  const canSubmit = required && consent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create your account</DialogTitle>
          <DialogDescription>
            Set up your ProntoPR workspace. You'll be signed in immediately.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            onComplete(form);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" required>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </Field>
            <Field label="Last name" required>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company" required>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
              />
            </Field>
            <Field label="Job title" required>
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="Work email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Phone number (optional)">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>

          <label className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(Boolean(v))}
              className="mt-0.5"
            />
            <span>
              I agree to the processing of my personal data in accordance with the
              ProntoPR Privacy Policy.
            </span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Create account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </Label>
      {children}
    </div>
  );
}
