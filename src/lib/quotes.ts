import type { MotivationalQuote, QuotePlacement } from "@/types/admin";

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function selectQuoteForPlacement(params: {
  quotes: MotivationalQuote[];
  placement: QuotePlacement;
  userId?: string;
  dateKey?: string;
}) {
  const eligible = params.quotes.filter(
    (quote) => quote.active && quote.placements.includes(params.placement)
  );

  if (eligible.length === 0) {
    return null;
  }

  const stableSeed = `${params.placement}:${params.userId ?? "guest"}:${
    params.dateKey ?? new Date().toISOString().slice(0, 10)
  }`;
  return eligible[hashString(stableSeed) % eligible.length];
}
