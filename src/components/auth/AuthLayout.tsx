import { Link } from "@tanstack/react-router";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/lib/branding";
import courtyard from "@/assets/auth-courtyard.jpg";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { appName, tagline, logoUrl } = useBranding();
  return (
    <div className="grid min-h-dvh bg-card lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col px-5 py-6 sm:px-10 sm:py-8 lg:px-16">
        {/* Brand header */}
        <Link to="/" className="flex shrink-0 items-center gap-2 text-primary">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 rounded-lg object-contain"
              width={32}
              height={32}
            />
          ) : (
            <Sun className="h-8 w-8" strokeWidth={2.5} />
          )}
          <span className="truncate text-lg font-semibold text-foreground">{appName}</span>
        </Link>

        {/* Form content — centred, scrollable on very short screens */}
        <div className="mx-auto w-full max-w-md flex-1 animate-rise py-8 sm:py-12">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && (
            <div className="mt-7 text-center text-sm leading-relaxed text-muted-foreground">
              {footer}
            </div>
          )}
        </div>

        {/* Footer — hidden on short viewports so it never crowds the form */}
        <div className="hidden shrink-0 flex-wrap items-center gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex">
          <span>© 2026 {appName}</span>
        </div>
      </div>
      <aside className="relative hidden min-h-dvh overflow-hidden bg-ink lg:block">
        <img
          src={courtyard}
          alt="Sunlit rental courtyard with palms and green shutters"
          width={1024}
          height={1536}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient scrim so text always reads against the photo */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 px-10 py-10 text-ink-foreground">
          <p className="mb-1 text-sm font-medium text-ink-foreground/60">{tagline}</p>
          <h2 className="max-w-lg text-3xl font-semibold leading-tight">
            A better home for your rental business.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-foreground/70">
            {appName} · Properties, people and rent, together.
          </p>
        </div>
      </aside>
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  right?: ReactNode;
  hint?: string | undefined;
  error?: string | undefined;
};

export function Field({ label, name, type = "text", right, hint, error, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  const description = hint || error ? `${name}-description` : undefined;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
        <label htmlFor={name}>{label}</label>
        {right}
      </div>
      <div className="relative">
        <input
          {...props}
          id={name}
          name={name}
          type={password && visible ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={description}
          className={`h-12 w-full min-w-0 rounded-lg border bg-card px-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${password ? "pr-12" : ""} ${error ? "border-destructive" : "border-foreground/15 hover:border-foreground/30"}`}
        />
        {password && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-10 w-10 text-muted-foreground"
            aria-label={visible ? "Hide password" : "Show password"}
            title={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
      {description && (
        <p
          id={description}
          className={`mt-2 text-xs leading-relaxed ${error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <Button type="submit" className="h-12 w-full rounded-lg font-semibold">
      {children}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function AuthNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm font-medium leading-relaxed ${error ? "bg-destructive-soft text-destructive" : "bg-primary-soft text-primary"}`}
    >
      {children}
    </p>
  );
}
