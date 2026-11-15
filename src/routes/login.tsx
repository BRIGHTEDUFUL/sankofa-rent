import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthLayout, AuthNotice, Field, SubmitButton } from "@/components/auth/AuthLayout";
import { useAuthActions } from "@convex-dev/auth/react";
import { useBranding } from "@/lib/branding";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Sankofa Rent" },
      { name: "description", content: "Sign in to manage your properties, tenants and rent." },
      { property: "og:title", content: "Sign in — Sankofa Rent" },
      {
        property: "og:description",
        content: "Sign in to manage your properties, tenants and rent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const { appName } = useBranding();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const email = String(values.get("email") || "");
    const password = String(values.get("password") || "");
    setError("");
    setPending(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      navigate({ to: "/", replace: true });
    } catch (err) {
      setError(friendlyError(err, "Sign-in failed. Check your details and try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your properties and rent."
      footer={
        <>
          New to {appName}?{" "}
          <Link to="/signup" className="-my-2 inline-block py-2 font-semibold text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          right={
            <Link
              to="/forgot-password"
              className="-my-2 inline-block py-2 text-xs font-semibold text-primary"
            >
              Forgot password?
            </Link>
          }
        />
        {error && <AuthNotice error>{error}</AuthNotice>}
        <SubmitButton>{pending ? "Signing in…" : "Sign in"}</SubmitButton>
      </form>
    </AuthLayout>
  );
}
