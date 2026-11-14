import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { ResponsiveDialog } from "@/components/app/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { friendlyError } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onSubmit: (values: FormData) => Promise<void>;
  submitLabel?: string;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  children,
  onSubmit,
  submitLabel = "Save",
}: Props) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setError("");
      }}
      title={title}
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const values = new FormData(e.currentTarget);
          setError("");
          setSubmitting(true);
          try {
            await onSubmit(values);
          } catch (err) {
            setError(friendlyError(err));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {children}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full justify-center sm:h-auto sm:w-auto"
          >
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
};

export function TextField({ label, name, hint, ...props }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  placeholder = "Select…",
  onValueChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  /** Optional hook to track the choice (e.g. to filter other fields' options). */
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select name={name} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirming,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  confirming?: string;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setError("");
      }}
      title={title}
      className="sm:max-w-md"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      {error && (
        <p className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="h-12 w-full justify-center sm:h-auto sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          className="h-12 w-full justify-center sm:h-auto sm:w-auto"
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onConfirm();
            } catch (err) {
              setError(friendlyError(err, "Something went wrong."));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Working…" : (confirming ?? "Delete")}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
