"use client";

import { cn } from "@/lib/utils";

type Props = {
  quote: {
    quote_text: string;
    author: string | null;
  };
  eyebrow?: string;
  className?: string;
  compact?: boolean;
};

export default function MotivationalQuoteCard({
  quote,
  eyebrow = "Motivation",
  className,
  compact = false,
}: Props) {
  return (
    <article
      className={cn(
        "rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 shadow-sm",
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-700">
        {eyebrow}
      </p>
      <blockquote
        className={cn(
          "mt-4 font-medium text-slate-900",
          compact ? "text-base leading-7" : "text-lg leading-8"
        )}
      >
        {quote.quote_text}
      </blockquote>
      {quote.author && (
        <p className="mt-4 text-sm font-semibold text-slate-600">~ {quote.author} ~</p>
      )}
    </article>
  );
}

