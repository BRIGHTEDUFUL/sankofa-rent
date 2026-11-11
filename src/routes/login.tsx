import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout, Field, SubmitButton } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Nyumba Rent" }, { name: "description", content: "Sign in to manage your properties, tenants and rent." }, { property: "og:title", content: "Sign in — Nyumba Rent" }, { property: "og:description", content: "Sign in to manage your properties, tenants and rent." }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your properties and rent." footer={<>New to Nyumba Rent? <Link to="/signup" className="font-semibold text-primary">Create an account</Link></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nav({ to: "/" }); }}>
        <Field label="Email or phone" placeholder="kofi@example.com or 024 000 0000" />
        <Field label="Password" type="password" placeholder="••••••••" right={<Link to="/forgot-password" className="text-xs font-semibold text-primary">Forgot password?</Link>} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" className="accent-[var(--primary)]" />Keep me signed in</label>
        <SubmitButton>Sign in</SubmitButton>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <button type="button" className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted">Continue with Google</button>
      </form>
    </AuthLayout>
  );
}
