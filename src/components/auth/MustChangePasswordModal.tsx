import { useState, type FormEvent } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ResponsiveDialog } from "@/components/app/ResponsiveDialog";
import { validatePassword } from "@/lib/auth-validation";
import { friendlyError } from "@/lib/format";
import { KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/app/AppShell";

export function MustChangePasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const completeMustChangePassword = useAction(api.passwordReset.completeMustChangePassword);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validatePassword(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await completeMustChangePassword({ newPassword: password });
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(friendlyError(err, "Could not update password. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create your permanent password"
      description="An administrator assigned a temporary password to your account. Please set a new permanent password now."
    >
      {success ? (
        <div className="py-6 text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Password updated successfully!
          </h3>
          <p className="text-xs text-muted-foreground">
            Your account is now secured with your new password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-semibold">Temporary password in use:</span> For your security,
              please choose a permanent password that only you know.
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-destructive-soft px-3.5 py-2.5 text-xs font-medium text-destructive"
            >
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="new-perm-pw">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-perm-pw"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoFocus
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="confirm-perm-pw">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-perm-pw"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Remind me later
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <KeyRound className="h-4 w-4" />
              {loading ? "Saving password…" : "Save new password"}
            </Button>
          </div>
        </form>
      )}
    </ResponsiveDialog>
  );
}

export function TemporaryPasswordBanner({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-xs text-amber-950 dark:text-amber-200">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="truncate">
          You are signed in with a temporary password set by an administrator.
        </span>
      </div>
      <button
        onClick={onOpenModal}
        className="shrink-0 font-semibold text-primary underline underline-offset-2 hover:opacity-80"
      >
        Set permanent password
      </button>
    </div>
  );
}
