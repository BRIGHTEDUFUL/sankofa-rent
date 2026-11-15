import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User,
  Building2,
  CreditCard,
  ShieldCheck,
  Palette,
  Upload,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  KeyRound,
  Trash2,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Badge, Button, Card } from "@/components/app/AppShell";
import { ConfirmDialog, FormDialog, TextField } from "@/components/app/FormDialog";
import { ResponsiveDialog } from "@/components/app/ResponsiveDialog";
import { useBranding, isHexColor, isUsableAccent, DEFAULT_BRANDING } from "@/lib/branding";
import { formatDate, friendlyError } from "@/lib/format";

const TAB_IDS = ["profile", "business", "accounts", "branding", "payments", "security"] as const;
type Tab = (typeof TAB_IDS)[number];

function generateMemorablePassword() {
  const words = [
    "Akwaaba",
    "Sankofa",
    "Oseikrom",
    "Kejetia",
    "Labadi",
    "Kasoa",
    "Tema",
    "Kumasi",
    "Sunyani",
    "Tamale",
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}@${num}`;
}

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const t = typeof search["tab"] === "string" ? search["tab"] : undefined;
    return t && (TAB_IDS as readonly string[]).includes(t) ? { tab: t as Tab } : {};
  },
  head: () => ({
    meta: [
      { title: "Settings — Sankofa Rent" },
      {
        name: "description",
        content: "Manage your profile, business, accounts, payments and team.",
      },
      { property: "og:title", content: "Settings — Sankofa Rent" },
      {
        property: "og:description",
        content: "Manage your profile, business, accounts, payments and team.",
      },
    ],
  }),
  component: Page,
});

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "business", label: "Business", icon: Building2 },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "payments", label: "Payment methods", icon: CreditCard },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

// Curated accents — all clear 4.5:1 against white so button text stays readable.
const ACCENT_SWATCHES = [
  "#4E735A", // default brand green
  "#1F6F5C", // teal green
  "#2563EB", // blue
  "#7C3AED", // violet
  "#B45309", // amber/brown
  "#BE123C", // rose
  "#0E7490", // cyan
  "#334155", // slate
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  region: string;
  momoNumber: string;
  momoNetwork: string;
  bankName: string;
  bankAccount: string;
  rentDueDay: number;
  lateFeePercent: string;
};

function fromProfile(p: Doc<"profiles">): FormState {
  return {
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    phone: p.phone ?? "",
    businessName: p.businessName ?? "",
    region: p.region ?? "",
    momoNumber: p.momoNumber ?? "",
    momoNetwork: p.momoNetwork ?? "",
    bankName: p.bankName ?? "",
    bankAccount: p.bankAccount ?? "",
    rentDueDay: p.rentDueDay,
    lateFeePercent: p.lateFeePercent !== undefined ? String(p.lateFeePercent) : "",
  };
}

// Sticky at the bottom on mobile, plain flex row on sm+
function SaveBar({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile: sticky bar above safe area */}
      <div className="sm:hidden sticky bottom-0 mt-6 flex justify-end px-0 pt-3 pb-[calc(0.75rem+var(--sab))] bg-card/95 backdrop-blur border-t border-border">
        {children}
      </div>
      {/* Desktop: plain right-aligned row */}
      <div className="hidden sm:flex justify-end mt-6">{children}</div>
    </>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mb-5 text-sm text-muted-foreground">{desc}</p>
      {children}
    </Card>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="px-2 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-soft">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  tone,
  label,
  value,
  onClick,
  destructive,
  selected,
  hideChevron,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value?: string;
  onClick: () => void;
  destructive?: boolean;
  selected?: boolean;
  hideChevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      className={`pressable flex min-h-[52px] w-full items-center gap-3 px-4 text-left hover:bg-muted/40 ${selected ? "lg:bg-muted" : ""}`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className={`flex-1 min-w-0 ${destructive ? "text-destructive" : "text-foreground"}`}>
        <span className="block truncate text-sm font-medium">{label}</span>
        {value && <span className="block truncate text-xs text-muted-foreground">{value}</span>}
      </span>
      <ChevronRight
        className={`h-5 w-5 shrink-0 text-muted-foreground/70 ${value ? "" : "ml-auto"}`}
      />
    </button>
  );
}

function SettingsListNav({
  form,
  isAdmin,
  appName,
  detailTab,
  onSelect,
  onSignOut,
}: {
  form: FormState;
  isAdmin: boolean;
  appName: string;
  detailTab: Tab;
  onSelect: (tab: Tab) => void;
  onSignOut: () => void;
}) {
  return (
    <nav aria-label="Settings sections">
      <SettingsGroup title="Account">
        <SettingsRow
          icon={User}
          tone="bg-primary-soft text-primary"
          label="Profile"
          value={form.firstName ? `${form.firstName} ${form.lastName}`.trim() : undefined}
          onClick={() => onSelect("profile")}
          selected={detailTab === "profile"}
        />
        <SettingsRow
          icon={Building2}
          tone="bg-gold-soft text-gold"
          label="Business details"
          value={form.businessName || undefined}
          onClick={() => onSelect("business")}
          selected={detailTab === "business"}
        />
      </SettingsGroup>

      {isAdmin && (
        <SettingsGroup title="Administration">
          <SettingsRow
            icon={Users}
            tone="bg-primary-soft text-primary"
            label="Account management"
            value="Team & admins"
            onClick={() => onSelect("accounts")}
            selected={detailTab === "accounts"}
          />
          <SettingsRow
            icon={Palette}
            tone="bg-ink text-ink-foreground"
            label="Branding"
            onClick={() => onSelect("branding")}
            selected={detailTab === "branding"}
          />
        </SettingsGroup>
      )}

      <SettingsGroup title="Money">
        <SettingsRow
          icon={CreditCard}
          tone="bg-success-soft text-success"
          label="Payment methods"
          value={form.momoNumber || undefined}
          onClick={() => onSelect("payments")}
          selected={detailTab === "payments"}
        />
      </SettingsGroup>

      <SettingsGroup title="System">
        <SettingsRow
          icon={ShieldCheck}
          tone="bg-muted text-muted-foreground"
          label="Security"
          onClick={() => onSelect("security")}
          selected={detailTab === "security"}
        />
      </SettingsGroup>

      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-soft">
        <SettingsRow
          icon={LogOut}
          tone="bg-destructive-soft text-destructive"
          label="Sign out"
          onClick={onSignOut}
          destructive
          hideChevron
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">{appName} · v1.0</p>
    </nav>
  );
}

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const profile = useQuery(api.profiles.me, {});
  const updateProfile = useMutation(api.profiles.update);
  const branding = useBranding();
  const brandingData = useQuery(api.branding.get, {});
  const saveBranding = useMutation(api.branding.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const isAdmin = profile?.role === "admin";

  // Account management state & queries (admin only)
  const accounts = useQuery(api.accounts.list, isAdmin ? {} : "skip");
  const updateAccountRole = useMutation(api.accounts.updateRole);
  const deleteAccountMutation = useMutation(api.accounts.deleteAccount);
  const createAccountAction = useAction(api.accounts.createAccount);
  const resetPasswordAction = useAction(api.accounts.resetPassword);
  const changeOwnPasswordAction = useAction(api.accounts.changePassword);

  // Password reset requests (admin only)
  const resetRequests = useQuery(api.passwordReset.listRequests, isAdmin ? {} : "skip");
  const fulfillResetAction = useAction(api.passwordReset.fulfillRequest);
  const rejectResetMutation = useMutation(api.passwordReset.rejectRequest);

  const [searchAccount, setSearchAccount] = useState("");
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [resetAccountTarget, setResetAccountTarget] = useState<{
    userId: Id<"users">;
    fullName: string;
    email: string;
  } | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    userId: Id<"users">;
    fullName: string;
    currentRole: "admin" | "user";
    newRole: "admin" | "user";
  } | null>(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<{
    userId: Id<"users">;
    fullName: string;
    email: string;
  } | null>(null);

  // Password reset request fulfillment state
  const [fulfillTarget, setFulfillTarget] = useState<{
    requestId: Id<"passwordResetRequests">;
    email: string;
    fullName: string;
  } | null>(null);
  const [tempPasswordVal, setTempPasswordVal] = useState("");
  const [fulfillAdminNote, setFulfillAdminNote] = useState("");
  const [showTempPw, setShowTempPw] = useState(false);
  const [copiedTempPw, setCopiedTempPw] = useState(false);
  const [fulfilledResult, setFulfilledResult] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{
    requestId: Id<"passwordResetRequests">;
    email: string;
  } | null>(null);
  const [showHistoryRequests, setShowHistoryRequests] = useState(false);

  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [accountActionMessage, setAccountActionMessage] = useState("");
  const [accountActionError, setAccountActionError] = useState("");

  // Security tab state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityError, setSecurityError] = useState("");

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Branding editor state (admin only).
  const [brand, setBrand] = useState<{
    appName: string;
    tagline: string;
    accentColor: string;
  } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandMessage, setBrandMessage] = useState("");
  const [brandError, setBrandError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !form) setForm(fromProfile(profile));
  }, [profile, form]);

  useEffect(() => {
    if (brandingData && !brand) {
      setBrand({
        appName: brandingData.appName,
        tagline: brandingData.tagline,
        accentColor: brandingData.accentColor,
      });
    }
  }, [brandingData, brand]);

  // Object URL for a logo picked but not yet saved.
  useEffect(() => {
    if (!logoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  if (!profile || !form) {
    return <Card className="h-64 animate-pulse bg-muted/40" />;
  }

  // Non-admins never see the Branding or Accounts tab (the server rejects the write too).
  const visibleTabs = tabs.filter((t) => (t.id !== "branding" && t.id !== "accounts") || isAdmin);
  const detailTab: Tab =
    search.tab && visibleTabs.some((t) => t.id === search.tab) ? search.tab : "profile";
  const showDetail = Boolean(search.tab); // mobile: list hidden when drilling in

  const filteredAccounts = (accounts ?? []).filter((acc) => {
    if (!searchAccount.trim()) return true;
    const q = searchAccount.trim().toLowerCase();
    return (
      acc.fullName.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.role.toLowerCase().includes(q) ||
      (acc.phone && acc.phone.includes(q))
    );
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  async function save(extra?: Partial<FormState>) {
    if (!form) return;
    const next = { ...form, ...extra };
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateProfile({
        firstName: next.firstName,
        lastName: next.lastName,
        phone: next.phone,
        businessName: next.businessName,
        region: next.region,
        momoNumber: next.momoNumber,
        momoNetwork: next.momoNetwork
          ? (next.momoNetwork as "MTN" | "Telecel" | "AirtelTigo")
          : undefined,
        bankName: next.bankName,
        bankAccount: next.bankAccount,
        rentDueDay: next.rentDueDay,
        lateFeePercent: next.lateFeePercent.trim() ? Number(next.lateFeePercent) : undefined,
      });
      setForm(next);
      setMessage("Saved.");
    } catch (err) {
      setError(friendlyError(err, "Could not save your changes."));
    } finally {
      setSaving(false);
    }
  }

  const initials =
    `${form.firstName} ${form.lastName}`
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "—";

  async function saveBrandingChanges() {
    if (!brand) return;
    setBrandSaving(true);
    setBrandError("");
    setBrandMessage("");
    try {
      let logoArg: { logoId?: Id<"_storage"> | null } = {};
      if (logoRemoved) {
        logoArg = { logoId: null };
      } else if (logoFile) {
        // 1) get an upload URL, 2) POST the file, 3) hand the storage id over.
        const url = await generateUploadUrl({});
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": logoFile.type },
          body: logoFile,
        });
        if (!res.ok) throw new Error("Upload failed — try a smaller image.");
        const { storageId } = (await res.json()) as { storageId: string };
        logoArg = { logoId: storageId as Id<"_storage"> };
      }
      await saveBranding({
        appName: brand.appName.trim(),
        tagline: brand.tagline.trim(),
        accentColor: brand.accentColor.trim(),
        ...logoArg,
      });
      setLogoFile(null);
      setLogoRemoved(false);
      setBrandMessage("Branding saved. It's live across the app already.");
    } catch (err) {
      setBrandError(friendlyError(err, "Could not save branding."));
    } finally {
      setBrandSaving(false);
    }
  }

  // Stage the shipped defaults (name/tagline/accent, no custom logo) in the
  // editor — the user still has to press Save to apply them.
  function resetBrandingForm() {
    setBrand({
      appName: DEFAULT_BRANDING.appName,
      tagline: DEFAULT_BRANDING.tagline,
      accentColor: DEFAULT_BRANDING.accentColor,
    });
    setLogoFile(null);
    setLogoRemoved(true);
    setBrandError("");
    setBrandMessage("Defaults staged — press Save branding to apply them.");
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Settings</h2>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Manage your account and how {branding.appName} works for you
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className={showDetail ? "hidden lg:block" : ""}>
          <SettingsListNav
            form={form}
            isAdmin={isAdmin}
            appName={branding.appName}
            detailTab={detailTab}
            onSelect={(t) => navigate({ to: "/settings", search: { tab: t }, replace: true })}
            onSignOut={() => setSignOutOpen(true)}
          />
        </div>
        <div className={`space-y-5 ${showDetail ? "" : "hidden lg:block"}`}>
          {/* Mobile: back button + horizontal tab chip strip */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => navigate({ to: "/settings", search: {}, replace: true })}
              className="mb-3 inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
              Settings
            </button>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    navigate({ to: "/settings", search: { tab: t.id as Tab }, replace: true })
                  }
                  className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition pressable ${
                    detailTab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {(message || error) && (
            <p
              role={error ? "alert" : "status"}
              className={`rounded-xl px-4 py-3 text-sm font-medium ${error ? "bg-destructive-soft text-destructive" : "bg-primary-soft text-primary"}`}
            >
              {error || message}
            </p>
          )}

          {detailTab === "profile" && (
            <Section title="Profile" desc="Your personal details">
              <div className="mb-6 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-ink text-lg font-semibold text-ink-foreground">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium">Avatar</p>
                  <p className="text-xs text-muted-foreground">Generated from your name</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="024 123 4567"
                  className="h-11 sm:h-9"
                />
              </div>
              <SaveBar>
                <Button
                  onClick={() => save()}
                  disabled={saving}
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </SaveBar>
            </Section>
          )}

          {detailTab === "business" && (
            <Section title="Business details" desc="Shown on invoices and receipts">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Business name"
                  name="businessName"
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="Mensah Properties"
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Region"
                  name="region"
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="Greater Accra"
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Currency"
                  name="currency"
                  value="GH₵ Ghana cedi"
                  readOnly
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Rent due day"
                  name="rentDueDay"
                  type="number"
                  min={1}
                  max={31}
                  value={form.rentDueDay}
                  onChange={(e) => set("rentDueDay", Number(e.target.value))}
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Late fee (%)"
                  name="lateFeePercent"
                  inputMode="decimal"
                  value={form.lateFeePercent}
                  onChange={(e) => set("lateFeePercent", e.target.value)}
                  placeholder="5"
                  className="h-11 sm:h-9"
                />
              </div>
              <SaveBar>
                <Button
                  onClick={() => save()}
                  disabled={saving}
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </SaveBar>
            </Section>
          )}

          {detailTab === "accounts" && isAdmin && (
            <div className="space-y-6">
              {/* Overview Metrics Cards */}
              {(() => {
                const pendingRequests = (resetRequests ?? []).filter((r) => r.status === "pending");
                const pastRequests = (resetRequests ?? []).filter((r) => r.status !== "pending");
                const pendingCount = pendingRequests.length;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Card className="p-4 bg-card/60 backdrop-blur">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Total Accounts
                        </p>
                        <p className="mt-1 text-2xl font-bold tracking-tight">
                          {accounts?.length ?? 0}
                        </p>
                      </Card>
                      <Card className="p-4 bg-card/60 backdrop-blur">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Administrators
                        </p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                          {accounts?.filter((a) => a.role === "admin").length ?? 0}
                        </p>
                      </Card>
                      <Card className="p-4 bg-card/60 backdrop-blur">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Standard Users
                        </p>
                        <p className="mt-1 text-2xl font-bold tracking-tight">
                          {accounts?.filter((a) => a.role !== "admin").length ?? 0}
                        </p>
                      </Card>
                      <Card
                        className={`p-4 backdrop-blur ${
                          pendingCount > 0
                            ? "border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20"
                            : "bg-card/60"
                        }`}
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Reset Requests
                        </p>
                        <p
                          className={`mt-1 text-2xl font-bold tracking-tight ${
                            pendingCount > 0 ? "text-amber-600 dark:text-amber-400" : ""
                          }`}
                        >
                          {pendingCount}
                        </p>
                      </Card>
                    </div>

                    {/* Pending Password Reset Requests Banner */}
                    {pendingCount > 0 && (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-200">
                              Pending Password Reset Requests ({pendingCount})
                            </h3>
                          </div>
                          <Badge tone="gold" className="text-xs">
                            Action Required
                          </Badge>
                        </div>
                        <div className="divide-y divide-amber-500/20 rounded-xl bg-card border border-amber-500/20 overflow-hidden shadow-soft">
                          {pendingRequests.map((req) => (
                            <div
                              key={req._id}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">
                                    {req.email}
                                  </span>
                                  {req.userExists ? (
                                    <Badge tone="purple" className="text-[10px]">
                                      {req.fullName} ({req.role})
                                    </Badge>
                                  ) : (
                                    <Badge tone="gray" className="text-[10px]">
                                      Unregistered email
                                    </Badge>
                                  )}
                                </div>
                                {req.note && (
                                  <p className="text-xs text-foreground/80">
                                    <span className="font-semibold text-foreground">
                                      User note/contact:
                                    </span>{" "}
                                    {req.note}
                                  </p>
                                )}
                                <p className="text-[11px] text-muted-foreground">
                                  Requested {formatDate(req.requestedAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    setRejectTarget({
                                      requestId: req._id,
                                      email: req.email,
                                    })
                                  }
                                >
                                  Dismiss
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 text-xs gap-1.5"
                                  onClick={() => {
                                    setTempPasswordVal(generateMemorablePassword());
                                    setFulfillAdminNote("");
                                    setFulfillTarget({
                                      requestId: req._id,
                                      email: req.email,
                                      fullName: req.fullName,
                                    });
                                  }}
                                >
                                  <KeyRound className="h-3.5 w-3.5" />
                                  Set Temp Password
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request History Accordion Toggle */}
                    {pastRequests.length > 0 && (
                      <div className="rounded-xl border border-border/70 bg-card/60 p-3">
                        <button
                          type="button"
                          onClick={() => setShowHistoryRequests((v) => !v)}
                          className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            Password Reset History ({pastRequests.length})
                          </span>
                          <span>{showHistoryRequests ? "Hide history" : "Show history"}</span>
                        </button>
                        {showHistoryRequests && (
                          <div className="mt-3 divide-y divide-border/60 border-t border-border/60 pt-2 text-xs">
                            {pastRequests.slice(0, 10).map((req) => (
                              <div
                                key={req._id}
                                className="py-2.5 flex flex-wrap items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{req.email}</span>
                                    <Badge
                                      tone={req.status === "resolved" ? "green" : "gray"}
                                      className="text-[10px]"
                                    >
                                      {req.status}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Requested: {formatDate(req.requestedAt)}
                                    {req.resolvedAt
                                      ? ` · Resolved: ${formatDate(req.resolvedAt)}`
                                      : ""}
                                    {req.adminNote ? ` · Note: ${req.adminNote}` : ""}
                                  </p>
                                </div>
                                {req.temporaryPassword && (
                                  <div className="flex items-center gap-1 font-mono text-[11px] bg-muted px-2 py-0.5 rounded">
                                    <span>Temp PW: {req.temporaryPassword}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Action and Search Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchAccount}
                    onChange={(e) => setSearchAccount(e.target.value)}
                    placeholder="Search accounts by name or email…"
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button
                  onClick={() => {
                    setAccountActionError("");
                    setAccountActionMessage("");
                    setCreateAccountOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl font-semibold shadow-sm w-full sm:w-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  Add account
                </Button>
              </div>

              {(accountActionMessage || accountActionError) && (
                <p
                  role={accountActionError ? "alert" : "status"}
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    accountActionError
                      ? "bg-destructive-soft text-destructive"
                      : "bg-primary-soft text-primary"
                  }`}
                >
                  {accountActionError || accountActionMessage}
                </p>
              )}

              {/* Accounts List */}
              <Card className="p-0 overflow-hidden divide-y divide-border/60">
                <div className="px-5 py-3.5 bg-muted/30 flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">Platform Users & Admins</h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    {filteredAccounts.length} user{filteredAccounts.length === 1 ? "" : "s"}
                  </span>
                </div>

                {filteredAccounts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No accounts found matching &ldquo;{searchAccount}&rdquo;
                  </div>
                ) : (
                  filteredAccounts.map((acc) => (
                    <div
                      key={acc.userId}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink font-semibold text-xs text-ink-foreground">
                          {initials(acc.fullName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm truncate">{acc.fullName}</span>
                            {acc.isCurrentUser && (
                              <Badge tone="purple" className="text-[10px] px-1.5 py-0.5">
                                You
                              </Badge>
                            )}
                            <Badge
                              tone={acc.role === "admin" ? "gold" : "gray"}
                              className="text-[10px] px-1.5 py-0.5"
                            >
                              {acc.role === "admin" ? "Admin" : "User"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {acc.email} {acc.phone ? `· ${acc.phone}` : ""}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 mt-1">
                            {acc.propertiesCount} propert{acc.propertiesCount === 1 ? "y" : "ies"} ·{" "}
                            {acc.tenantsCount} tenant{acc.tenantsCount === 1 ? "" : "s"} · Joined{" "}
                            {formatDate(acc.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 self-stretch sm:self-auto justify-end shrink-0">
                        {acc.role === "user" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium"
                            onClick={() => {
                              setAccountActionError("");
                              setAccountActionMessage("");
                              setRoleChangeTarget({
                                userId: acc.userId,
                                fullName: acc.fullName,
                                currentRole: "user",
                                newRole: "admin",
                              });
                            }}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Promote to admin
                          </Button>
                        ) : (
                          !acc.isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setAccountActionError("");
                                setAccountActionMessage("");
                                setRoleChangeTarget({
                                  userId: acc.userId,
                                  fullName: acc.fullName,
                                  currentRole: "admin",
                                  newRole: "user",
                                });
                              }}
                            >
                              Demote to user
                            </Button>
                          )
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          title="Reset password"
                          onClick={() => {
                            setAccountActionError("");
                            setAccountActionMessage("");
                            setResetAccountTarget({
                              userId: acc.userId,
                              fullName: acc.fullName,
                              email: acc.email,
                            });
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5 mr-1" />
                          Reset PW
                        </Button>

                        {!acc.isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                            title="Delete account"
                            onClick={() => {
                              setAccountActionError("");
                              setAccountActionMessage("");
                              setDeleteAccountTarget({
                                userId: acc.userId,
                                fullName: acc.fullName,
                                email: acc.email,
                              });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>
          )}

          {detailTab === "branding" && isAdmin && brand && (
            <Section
              title="Branding"
              desc="The name, logo and colour shown across the app — including the login page and browser tab"
            >
              {/* Live preview of the header + login identity */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center gap-3 bg-background px-4 py-3">
                  {(previewUrl ?? (logoRemoved ? null : branding.logoUrl)) ? (
                    <img
                      src={(previewUrl ?? (logoRemoved ? null : branding.logoUrl)) as string}
                      alt=""
                      className="h-9 w-9 rounded-lg object-contain"
                      width={36}
                      height={36}
                    />
                  ) : (
                    <span
                      className="grid h-9 w-9 place-items-center rounded-lg text-lg font-semibold text-white"
                      style={{ backgroundColor: brand.accentColor }}
                      aria-hidden
                    >
                      {brand.appName.slice(0, 1).toUpperCase() || "A"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {brand.appName || "Untitled app"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{brand.tagline}</p>
                  </div>
                  <span
                    className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: brand.accentColor }}
                  >
                    Preview
                  </span>
                </div>
                <div className="border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
                  Browser tab: {brand.appName || "Untitled"} — Settings
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="App name"
                  name="appName"
                  value={brand.appName}
                  maxLength={60}
                  onChange={(e) => setBrand({ ...brand, appName: e.target.value })}
                  placeholder="Sankofa Rent"
                  hint="Up to 60 characters. Shown in the header, login page and tab title."
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Tagline"
                  name="tagline"
                  value={brand.tagline}
                  maxLength={120}
                  onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
                  placeholder="Your property. Your peace of mind."
                  hint="Up to 120 characters. Shown under the app name on sign-in pages."
                  className="h-11 sm:h-9"
                />
              </div>

              {/* Accent colour */}
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium">Accent colour</p>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Use accent colour ${c}`}
                      aria-pressed={brand.accentColor.toLowerCase() === c.toLowerCase()}
                      onClick={() => setBrand({ ...brand, accentColor: c })}
                      className={`h-9 w-9 rounded-full transition ${brand.accentColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label className="ml-1 flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm hover:bg-muted">
                    Custom
                    <input
                      type="color"
                      value={isHexColor(brand.accentColor) ? brand.accentColor : "#4E735A"}
                      onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })}
                      className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
                      aria-label="Pick a custom accent colour"
                    />
                  </label>
                </div>
                {!isUsableAccent(brand.accentColor) && (
                  <p className="mt-2 text-xs text-destructive" role="alert">
                    Too light — white text on this colour wouldn't be readable. Pick a darker shade.
                  </p>
                )}
              </div>

              {/* Logo upload */}
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium">Logo</p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {branding.logoUrl && !logoRemoved ? "Replace logo" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="Upload logo file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setBrandError("");
                        if (!f) return;
                        if (!f.type.startsWith("image/")) {
                          setBrandError("The logo file must be an image.");
                          return;
                        }
                        if (f.size > 1024 * 1024) {
                          setBrandError("Logo must be 1 MB or smaller.");
                          return;
                        }
                        setLogoFile(f);
                        setLogoRemoved(false);
                      }}
                    />
                  </label>
                  {((branding.logoUrl && !logoRemoved) || logoFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoRemoved(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Remove logo
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    PNG, SVG or JPG · max 1 MB · falls back to the default mark
                  </span>
                </div>
              </div>

              {(brandMessage || brandError) && (
                <p
                  role={brandError ? "alert" : "status"}
                  className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${brandError ? "bg-destructive-soft text-destructive" : "bg-primary-soft text-primary"}`}
                >
                  {brandError || brandMessage}
                </p>
              )}

              <SaveBar>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    variant="ghost"
                    onClick={resetBrandingForm}
                    disabled={brandSaving}
                    className="flex-1 h-12 justify-center sm:flex-none sm:h-auto"
                  >
                    Reset to defaults
                  </Button>
                  <Button
                    onClick={() => saveBrandingChanges()}
                    disabled={
                      brandSaving ||
                      !brand.appName.trim() ||
                      !brand.tagline.trim() ||
                      !isUsableAccent(brand.accentColor)
                    }
                    className="flex-1 h-12 justify-center sm:flex-none sm:h-auto"
                  >
                    {brandSaving ? "Saving…" : "Save branding"}
                  </Button>
                </div>
              </SaveBar>
            </Section>
          )}

          {detailTab === "payments" && (
            <Section title="Payment methods" desc="Where your tenants pay rent">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="MoMo number"
                  name="momoNumber"
                  value={form.momoNumber}
                  onChange={(e) => set("momoNumber", e.target.value)}
                  placeholder="024 123 4567"
                  className="h-11 sm:h-9"
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">MoMo network</label>
                  <select
                    name="momoNetwork"
                    value={form.momoNetwork}
                    onChange={(e) => set("momoNetwork", e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base focus:ring-1 focus:ring-ring sm:h-9 sm:text-sm"
                  >
                    <option value="">Not set</option>
                    <option value="MTN">MTN</option>
                    <option value="Telecel">Telecel</option>
                    <option value="AirtelTigo">AirtelTigo</option>
                  </select>
                </div>
                <TextField
                  label="Bank name"
                  name="bankName"
                  value={form.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                  placeholder="GCB Bank"
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Bank account"
                  name="bankAccount"
                  value={form.bankAccount}
                  onChange={(e) => set("bankAccount", e.target.value)}
                  placeholder="•••• 4410"
                  className="h-11 sm:h-9"
                />
              </div>
              <SaveBar>
                <Button
                  onClick={() => save()}
                  disabled={saving}
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </SaveBar>
            </Section>
          )}

          {detailTab === "security" && (
            <div className="space-y-6">
              <Section title="Account" desc="Your account tier and roles">
                <div className="divide-y divide-border/70">
                  <div className="flex min-h-[52px] items-center justify-between px-1">
                    <span className="text-sm font-medium">Plan</span>
                    <Badge tone="green">{profile.plan}</Badge>
                  </div>
                  <div className="flex min-h-[52px] items-center justify-between px-1">
                    <span className="text-sm font-medium">Role</span>
                    <Badge tone={profile.role === "admin" ? "gold" : "gray"}>
                      {profile.role === "admin" ? "Administrator" : "Member"}
                    </Badge>
                  </div>
                  <div className="flex min-h-[52px] items-center justify-between px-1">
                    <span className="text-sm font-medium">Currency</span>
                    <span className="text-sm text-muted-foreground">{profile.currency}</span>
                  </div>
                </div>
              </Section>

              <Section
                title="Change password"
                desc="Update your password for signing into Sankofa Rent"
              >
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentPw) {
                      setSecurityError("Please enter your current password.");
                      return;
                    }
                    if (newPw.length < 8) {
                      setSecurityError("New password must be at least 8 characters.");
                      return;
                    }
                    if (newPw !== confirmPw) {
                      setSecurityError("New passwords do not match.");
                      return;
                    }
                    setSecurityLoading(true);
                    setSecurityError("");
                    setSecurityMessage("");
                    try {
                      await changeOwnPasswordAction({
                        currentPassword: currentPw,
                        newPassword: newPw,
                      });
                      setCurrentPw("");
                      setNewPw("");
                      setConfirmPw("");
                      setSecurityMessage("Password changed successfully.");
                    } catch (err) {
                      setSecurityError(friendlyError(err, "Failed to change password."));
                    } finally {
                      setSecurityLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <TextField
                    label="Current password"
                    name="currentPassword"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                    className="h-11 sm:h-9"
                    required
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="New password"
                      name="newPassword"
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="At least 8 characters"
                      className="h-11 sm:h-9"
                      required
                    />
                    <TextField
                      label="Confirm new password"
                      name="confirmPassword"
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Re-type new password"
                      className="h-11 sm:h-9"
                      required
                    />
                  </div>

                  {(securityMessage || securityError) && (
                    <p
                      role={securityError ? "alert" : "status"}
                      className={`rounded-xl px-4 py-3 text-sm font-medium ${
                        securityError
                          ? "bg-destructive-soft text-destructive"
                          : "bg-primary-soft text-primary"
                      }`}
                    >
                      {securityError || securityMessage}
                    </p>
                  )}

                  <SaveBar>
                    <Button
                      type="submit"
                      disabled={securityLoading || !currentPw || !newPw || !confirmPw}
                      className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                    >
                      {securityLoading ? "Updating…" : "Update password"}
                    </Button>
                  </SaveBar>
                </form>
              </Section>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out?"
        message="You'll need your password to sign back in."
        confirming="Sign out"
        onConfirm={async () => {
          await signOut();
          window.location.assign("/login");
        }}
      />

      {createAccountOpen && (
        <FormDialog
          open={createAccountOpen}
          onOpenChange={setCreateAccountOpen}
          title="Create New Account"
          submitLabel="Create account"
          onSubmit={async (values) => {
            const email = String(values.get("email") ?? "");
            const password = String(values.get("password") ?? "");
            const role = (values.get("role") ?? "user") as "admin" | "user";
            const firstName = String(values.get("firstName") ?? "");
            const lastName = String(values.get("lastName") ?? "");
            const phone = String(values.get("phone") ?? "").trim() || undefined;
            const businessName = String(values.get("businessName") ?? "").trim() || undefined;

            await createAccountAction({
              email,
              password,
              role,
              firstName,
              lastName,
              phone,
              businessName,
            });
            setCreateAccountOpen(false);
            setAccountActionMessage(
              `Account for ${email} created as ${
                role === "admin" ? "an Administrator" : "a Standard User"
              }.`,
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="First name" name="firstName" required placeholder="Kofi" />
            <TextField label="Last name" name="lastName" required placeholder="Mensah" />
          </div>
          <TextField
            label="Email address"
            name="email"
            type="email"
            required
            placeholder="kofi@example.com"
          />
          <TextField
            label="Password (min 8 chars)"
            name="password"
            type="password"
            required
            placeholder="••••••••"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Account role</label>
            <select
              name="role"
              defaultValue="user"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-ring"
            >
              <option value="user">Standard Landlord (User)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Administrators have branding control, account management, and multi-admin rights.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Phone (optional)" name="phone" placeholder="024 123 4567" />
            <TextField
              label="Business name (optional)"
              name="businessName"
              placeholder="e.g. Accra Rentals"
            />
          </div>
        </FormDialog>
      )}

      {resetAccountTarget && (
        <ResponsiveDialog
          open={Boolean(resetAccountTarget)}
          onOpenChange={(open) => !open && setResetAccountTarget(null)}
          title={`Reset password for ${resetAccountTarget.fullName}`}
          description={`Set a new temporary password for ${resetAccountTarget.email}`}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const newPassword = String(form.get("newPassword") ?? "");
              if (newPassword.length < 8) {
                setAccountActionError("Password must be at least 8 characters.");
                return;
              }
              setAccountActionLoading(true);
              try {
                await resetPasswordAction({
                  userId: resetAccountTarget.userId,
                  newPassword,
                });
                setAccountActionMessage(
                  `Password reset successfully for ${resetAccountTarget.email}.`,
                );
                setResetAccountTarget(null);
              } catch (err) {
                setAccountActionError(friendlyError(err, "Could not reset password."));
              } finally {
                setAccountActionLoading(false);
              }
            }}
            className="space-y-4 pt-2"
          >
            <TextField
              label="New password"
              name="newPassword"
              type="password"
              placeholder="Minimum 8 characters"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Note: The user will automatically be prompted to choose their own new password the
              next time they sign in.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setResetAccountTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={accountActionLoading}>
                {accountActionLoading ? "Saving…" : "Set new password"}
              </Button>
            </div>
          </form>
        </ResponsiveDialog>
      )}

      {/* Fulfill Password Reset Request Dialog */}
      {fulfillTarget && (
        <ResponsiveDialog
          open={Boolean(fulfillTarget)}
          onOpenChange={(open) => !open && setFulfillTarget(null)}
          title={`Set Temporary Password for ${fulfillTarget.fullName}`}
          description={`Issue a temporary password for ${fulfillTarget.email}`}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (tempPasswordVal.length < 8) {
                setAccountActionError("Password must be at least 8 characters.");
                return;
              }
              setAccountActionLoading(true);
              try {
                await fulfillResetAction({
                  requestId: fulfillTarget.requestId,
                  temporaryPassword: tempPasswordVal,
                  adminNote: fulfillAdminNote || undefined,
                });
                setFulfilledResult({
                  email: fulfillTarget.email,
                  temporaryPassword: tempPasswordVal,
                });
                setFulfillTarget(null);
              } catch (err) {
                setAccountActionError(friendlyError(err, "Could not set temporary password."));
              } finally {
                setAccountActionLoading(false);
              }
            }}
            className="space-y-4 pt-2"
          >
            <div className="rounded-xl bg-accent/40 p-3 text-xs text-muted-foreground">
              Account: <span className="font-semibold text-foreground">{fulfillTarget.email}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Temporary Password</label>
                <button
                  type="button"
                  onClick={() => setTempPasswordVal(generateMemorablePassword())}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </button>
              </div>
              <div className="relative">
                <input
                  type={showTempPw ? "text" : "password"}
                  value={tempPasswordVal}
                  onChange={(e) => setTempPasswordVal(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowTempPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showTempPw ? "Hide password" : "Show password"}
                >
                  {showTempPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                The user will be required to change this password as soon as they sign in.
              </p>
            </div>

            <TextField
              label="Admin note (optional)"
              name="adminNote"
              placeholder="e.g. Sent via WhatsApp, verified by phone"
              value={fulfillAdminNote}
              onChange={(e) => setFulfillAdminNote(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setFulfillTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={accountActionLoading}>
                {accountActionLoading ? "Setting password…" : "Set Password & Resolve"}
              </Button>
            </div>
          </form>
        </ResponsiveDialog>
      )}

      {/* Temporary Password Result & Copy Dialog */}
      {fulfilledResult && (
        <ResponsiveDialog
          open={Boolean(fulfilledResult)}
          onOpenChange={(open) => {
            if (!open) {
              setFulfilledResult(null);
              setCopiedTempPw(false);
            }
          }}
          title="Temporary Password Ready"
          description="Share this temporary password with the user."
        >
          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-1">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                Temporary Password Set Successfully
              </p>
              <p className="text-xs text-muted-foreground">
                For account:{" "}
                <span className="font-semibold text-foreground">{fulfilledResult.email}</span>
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Temporary Password
              </p>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3 font-mono text-base font-bold text-foreground">
                <span className="tracking-wider">{fulfilledResult.temporaryPassword}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs font-sans"
                  onClick={() => {
                    navigator.clipboard.writeText(fulfilledResult.temporaryPassword);
                    setCopiedTempPw(true);
                    setTimeout(() => setCopiedTempPw(false), 2000);
                  }}
                >
                  {copiedTempPw ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy password
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide this temporary password to the user. When they log in with it, they will
                automatically be prompted to set their own permanent password.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  setFulfilledResult(null);
                  setCopiedTempPw(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </ResponsiveDialog>
      )}

      {/* Reject Reset Request Confirm Dialog */}
      {rejectTarget && (
        <ConfirmDialog
          open={Boolean(rejectTarget)}
          onOpenChange={(open) => !open && setRejectTarget(null)}
          title={`Dismiss reset request for ${rejectTarget.email}?`}
          message="This request will be marked as dismissed. The user's existing credentials will remain unchanged."
          confirming="Dismiss request"
          onConfirm={async () => {
            try {
              await rejectResetMutation({
                requestId: rejectTarget.requestId,
              });
              setAccountActionMessage(`Request for ${rejectTarget.email} dismissed.`);
            } catch (err) {
              setAccountActionError(friendlyError(err, "Could not dismiss request."));
            } finally {
              setRejectTarget(null);
            }
          }}
        />
      )}

      {roleChangeTarget && (
        <ConfirmDialog
          open={Boolean(roleChangeTarget)}
          onOpenChange={(open) => !open && setRoleChangeTarget(null)}
          title={
            roleChangeTarget.newRole === "admin"
              ? `Promote ${roleChangeTarget.fullName} to Administrator?`
              : `Demote ${roleChangeTarget.fullName} to Standard User?`
          }
          message={
            roleChangeTarget.newRole === "admin"
              ? "This user will gain full administrator rights, including the ability to manage accounts and edit branding."
              : "This user will lose administrative access and be restricted to standard property and tenancy management."
          }
          confirming={roleChangeTarget.newRole === "admin" ? "Promote to Admin" : "Demote to User"}
          onConfirm={async () => {
            try {
              await updateAccountRole({
                userId: roleChangeTarget.userId,
                role: roleChangeTarget.newRole,
              });
              setAccountActionMessage(
                `${roleChangeTarget.fullName} is now ${
                  roleChangeTarget.newRole === "admin" ? "an Administrator" : "a Standard User"
                }.`,
              );
            } catch (err) {
              setAccountActionError(friendlyError(err, "Could not update account role."));
            } finally {
              setRoleChangeTarget(null);
            }
          }}
        />
      )}

      {deleteAccountTarget && (
        <ConfirmDialog
          open={Boolean(deleteAccountTarget)}
          onOpenChange={(open) => !open && setDeleteAccountTarget(null)}
          title={`Delete account for ${deleteAccountTarget.fullName}?`}
          message={`Are you sure you want to delete ${deleteAccountTarget.email}? Their login access will be permanently revoked.`}
          confirming="Delete account"
          onConfirm={async () => {
            try {
              await deleteAccountMutation({
                userId: deleteAccountTarget.userId,
              });
              setAccountActionMessage(`Account for ${deleteAccountTarget.email} deleted.`);
            } catch (err) {
              setAccountActionError(friendlyError(err, "Could not delete account."));
            } finally {
              setDeleteAccountTarget(null);
            }
          }}
        />
      )}
    </div>
  );
}
