import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, AuthNotice, Field, GoogleButton, SubmitButton } from "@/components/auth/AuthLayout";
import { validatePassword } from "@/lib/auth-validation";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Nyumba Rent" }, { name: "description", content: "Start managing your rental properties in Ghana." }, { property: "og:title", content: "Create account — Nyumba Rent" }, { property: "og:description", content: "Start managing your rental properties in Ghana." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Page,
});

function Page() {
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState("");
  return (
    <AuthLayout title="Create your account" subtitle="Make room for a simpler way to manage your rentals." footer={<>Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link></>}>
      <form className="space-y-4" onChange={() => { setError(undefined); setNotice(""); }} onSubmit={(e) => {
        e.preventDefault();
        const values = new FormData(e.currentTarget);
        const problem = validatePassword(String(values.get("password") || ""), String(values.get("confirmPassword") || ""));
        setError(problem);
        setNotice(problem ? "" : "Account creation isn’t connected yet. Your details weren’t sent or saved.");
      }}>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2"><Field label="First name" name="firstName" autoComplete="given-name" required placeholder="First name" /><Field label="Last name" name="lastName" autoComplete="family-name" required placeholder="Last name" /></div>
        <Field label="Email address" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Field label="Phone number (optional)" name="phone" type="tel" autoComplete="tel" placeholder="024 000 0000" />
        <Field label="Password" name="password" type="password" autoComplete="new-password" required placeholder="Create a password" hint="Use at least 8 characters." />
        <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required placeholder="Re-enter your password" error={error} />
        {notice && <AuthNotice>{notice}</AuthNotice>}
        <SubmitButton>Create account</SubmitButton>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <GoogleButton onClick={() => setNotice("Google sign-in isn’t connected yet. No account was created.")} />
      </form>
    </AuthLayout>
  );
}
