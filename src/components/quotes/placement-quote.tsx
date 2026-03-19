"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import { fetchMotivationalQuotes } from "@/lib/supabase/repositories";
import { selectQuoteForPlacement } from "@/lib/quotes";
import type { MotivationalQuote, QuotePlacement } from "@/types/admin";
import MotivationalQuoteCard from "./motivational-quote-card";

type Props = {
  placement: QuotePlacement;
  eyebrow?: string;
  className?: string;
  compact?: boolean;
};

export default function PlacementQuote({
  placement,
  eyebrow,
  className,
  compact,
}: Props) {
  const { user } = useAuth();
  const [quote, setQuote] = useState<MotivationalQuote | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMotivationalQuotes({ placement })
      .then((quotes) => {
        if (!isMounted) return;
        setQuote(
          selectQuoteForPlacement({
            quotes,
            placement,
            userId: user?.id,
          })
        );
      })
      .catch((error) => {
        console.error(`Failed to load ${placement} quote`, error);
      });

    return () => {
      isMounted = false;
    };
  }, [placement, user?.id]);

  if (!quote) {
    return null;
  }

  return (
    <MotivationalQuoteCard
      quote={quote}
      eyebrow={eyebrow}
      className={className}
      compact={compact}
    />
  );
}
