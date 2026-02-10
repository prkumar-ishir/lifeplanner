"use client";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <div className="glass-panel p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}
