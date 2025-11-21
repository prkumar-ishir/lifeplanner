import Image from "next/image";
import Link from "next/link";
import ishirLogo from "@/app/ishir-logo.png";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-slate-500">
        <Link href="https://www.ishir.com" target="_blank" rel="noreferrer" className="flex items-center gap-2">
          <Image src={ishirLogo} alt="ISHIR logo" className="h-6 w-auto" />
          <span className="hidden sm:inline text-slate-600">ISHIR</span>
        </Link>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          Copyright © 1999-2025 ISHIR
        </p>
      </div>
    </footer>
  );
}
