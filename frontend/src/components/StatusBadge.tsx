import type { Status } from "@/lib/types";

const styles: Record<string, string> = {
  uploaded: "bg-slate-100 text-slate-700 ring-slate-200",
  processing: "bg-amber-100 text-amber-800 ring-amber-200",
  completed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  failed: "bg-red-100 text-red-800 ring-red-200"
};

export function StatusBadge({ status }: { status: Status }) {
  const className = styles[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${className}`}>
      {status}
    </span>
  );
}
