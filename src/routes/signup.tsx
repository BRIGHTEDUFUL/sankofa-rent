import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout, Field, SubmitButton } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Nyumba Rent" }, { name: "description", content: "Start managing your rental properties in Ghana." }, { property: "og:title", content: "Create account — Nyumba Rent" }, { property: "og:description", content: "Start managing your rental properties in Ghana." }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  return (
    <AuthLayout title="Create your account" subtitle="Set up in minutes. Free for up to 5 units." footer={<>Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nav({ to: "/" }); }}>
        <div className="grid grid-cols-2 gap-3"><Field label="First name" placeholder="Kofi" /><Field label="Last name" placeholder="Mensah" /></div>
        <Field label="Email" type="email" placeholder="kofi@example.com" />
        <Field label="Phone number" type="tel" placeholder="024 000 0000" />
        <Field label="Password" type="password" placeholder="At least 8 characters" />
        <label className="flex items-start gap-2 text-sm text-muted-foreground"><input type="checkbox" className="mt-1 accent-[var(--primary)]" />I agree to the terms of service and privacy policy</label>
        <SubmitButton>Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
}
