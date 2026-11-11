import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Sun, ShieldCheck, Smartphone, Receipt } from "lucide-react";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex flex-col justify-between p-6 sm:p-10">
        <Link to="/" className="flex items-center gap-2 text-primary"><Sun className="h-8 w-8" strokeWidth={2.5} /><span className="text-lg font-semibold text-foreground">Nyumba Rent</span></Link>
        <div className="mx-auto w-full max-w-sm animate-rise py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
        <p className="text-xs text-muted-foreground">© 2026 Nyumba Rent · Made in Accra</p>
      </div>
      <div className="relative hidden overflow-hidden bg-ink p-10 text-ink-foreground lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-primary opacity-40 blur-3xl" />
        <div className="relative space-y-6">
          <h2 className="max-w-md text-4xl font-semibold leading-tight">Collect rent on time, every month — without the chasing.</h2>
          <div className="grid max-w-md gap-3">
            {[[Smartphone, "MoMo & bank payments tracked automatically"], [Receipt, "Invoices and receipts sent by SMS"], [ShieldCheck, "Leases and tenant records kept safe"]].map(([I, t]) => {
              const Icon = I as typeof Sun;
              return <div key={t as string} className="flex items-center gap-3 rounded-2xl bg-ink-foreground/10 p-4 text-sm"><Icon className="h-5 w-5 text-primary" />{t as string}</div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, type = "text", placeholder, right }: { label: string; type?: string; placeholder?: string; right?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-sm font-medium">{label}{right}</span>
      <input type={type} placeholder={placeholder} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return <button type="submit" className="w-full rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90">{children}</button>;
}
