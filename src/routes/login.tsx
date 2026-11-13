import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, AuthNotice, Field, GoogleButton, SubmitButton } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Nyumba Rent" }, { name: "description", content: "Sign in to manage your properties, tenants and rent." }, { property: "og:title", content: "Sign in — Nyumba Rent" }, { property: "og:description", content: "Sign in to manage your properties, tenants and rent." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Page,
});

function Page() {
  const [notice, setNotice] = useState("");
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your properties and rent." footer={<>New to Nyumba Rent? <Link to="/signup" className="font-semibold text-primary">Create an account</Link></>}>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setNotice("Sign-in isn’t connected yet. No details were sent or saved."); }}>
        <Field label="Email address" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" right={<Link to="/forgot-password" className="text-xs font-semibold text-primary">Forgot password?</Link>} />
        {notice && <AuthNotice>{notice}</AuthNotice>}
        <SubmitButton>Sign in</SubmitButton>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <GoogleButton onClick={() => setNotice("Google sign-in isn’t connected yet. No account was accessed.")} />
      </form>
    </AuthLayout>
  );
}
