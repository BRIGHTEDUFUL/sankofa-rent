import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { AuthLayout, AuthNotice, Field, SubmitButton } from "@/components/auth/AuthLayout";
import { validatePassword } from "@/lib/auth-validation";
import { friendlyError } from "@/lib/format";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Sankofa Rent" },
      { name: "description", content: "Start managing your rental properties in Ghana." },
      { property: "og:title", content: "Create account — Sankofa Rent" },
      { property: "og:description", content: "Start managing your rental properties in Ghana." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const updateProfile = useMutation(api.profiles.update);

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<{
    firstName: string;
    lastName: string;
    phone?: string;
  } | null>(null);

  // Save the collected names only once the client is actually authenticated.
  useEffect(() => {
    if (!isAuthenticated || !pendingProfile) return;
    const profile = pendingProfile;
    setPendingProfile(null);
    (async () => {
      try {
        await updateProfile({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        });
        navigate({ to: "/", replace: true });
      } catch (err) {
        setError(
          friendlyError(err, "Your account was created, but the profile could not be saved."),
        );
      }
    })();
  }, [isAuthenticated, pendingProfile, updateProfile, navigate]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const firstName = String(values.get("firstName") || "").trim();
    const lastName = String(values.get("lastName") || "").trim();
    const email = String(values.get("email") || "");
    const phone = String(values.get("phone") || "").trim();
    const password = String(values.get("password") || "");
    const confirmPassword = String(values.get("confirmPassword") || "");
    const problem = validatePassword(password, confirmPassword);
    if (problem) {
      setError(problem);
      return;
    }
    if (!firstName || !lastName) {
      setError("Enter your first and last name.");
      return;
    }
    setError("");
    setPending(true);
    try {
      await signIn("password", { email, password, flow: "signUp" });
      setPendingProfile({ firstName, lastName, phone: phone || undefined });
    } catch (err) {
      setError(friendlyError(err, "Account creation failed. Check your details and try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Make room for a simpler way to manage your rentals."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="-my-2 inline-block py-2 font-semibold text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
          <Field
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
            placeholder="First name"
          />
          <Field
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            required
            placeholder="Last name"
          />
        </div>
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
        <Field
          label="Phone number (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="024 000 0000"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Create a password"
          hint="Use at least 8 characters."
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Re-enter your password"
        />
        {error && <AuthNotice error>{error}</AuthNotice>}
        <SubmitButton>{pending ? "Creating account…" : "Create account"}</SubmitButton>
      </form>
    </AuthLayout>
  );
}
