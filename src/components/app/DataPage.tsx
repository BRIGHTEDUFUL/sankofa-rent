import type { ReactNode } from "react";
import { Banknote, Plus } from "lucide-react";
import { Card, Button } from "./AppShell";

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataPage<T>({
  title,
  subtitle,
  action,
  onAction,
  secondaryAction,
  stats,
  columns,
  rows,
  aside,
  loading,
}: {
  title: string;
  subtitle: string;
  action: string;
  onAction?: () => void;
  secondaryAction?: { label: string; onClick: () => void };
  stats?: { label: string; value: string; hint?: string }[];
  columns: Column<T>[];
  rows: T[];
  aside?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Button
            className="h-12 w-full justify-center sm:h-auto sm:w-auto sm:justify-start"
            onClick={onAction}
          >
            <Plus className="h-4 w-4" />
            {action}
          </Button>
          {secondaryAction && (
            <Button
              variant="outline"
              className="h-12 w-full justify-center sm:h-auto sm:w-auto sm:justify-start"
              onClick={secondaryAction.onClick}
            >
              <Banknote className="h-4 w-4" />
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="!p-4 sm:!p-5">
              <p className="text-xs text-muted-foreground sm:text-sm">{s.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{s.value}</p>
              {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
            </Card>
          ))}
        </div>
      )}

      {aside}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-20 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-medium">Nothing here yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Records you create will appear here.</p>
        </Card>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="stagger-children space-y-3 md:hidden">
            {rows.map((r, i) => (
              <Card key={i} className="!p-4 transition-colors active:bg-muted/40">
                {/* Title + action */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-sm">{columns[0]?.render(r)}</div>
                  {columns.length > 1 && (
                    <div className="shrink-0">{columns[columns.length - 1]?.render(r)}</div>
                  )}
                </div>
                {/* Middle fields — 2-col grid on most phones, 1-col at 320px */}
                <dl className="mt-3 grid grid-cols-1 gap-y-2.5 border-t border-border/60 pt-3 text-sm min-[380px]:grid-cols-2">
                  {columns.slice(1, -1).map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {c.label}
                      </dt>
                      <dd
                        className="mt-0.5 min-w-0 overflow-hidden"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        {c.render(r)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>

          {/* Desktop table view */}
          <Card className="hidden !p-0 md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b text-left text-xs uppercase tracking-widest text-muted-foreground">
                    {columns.map((c) => (
                      <th key={c.key} className={`px-6 py-4 font-semibold ${c.className ?? ""}`}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0 transition-colors hover:bg-muted/50 group"
                    >
                      {columns.map((c) => (
                        <td key={c.key} className={`px-6 py-4 ${c.className ?? ""}`}>
                          {c.render(r)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
