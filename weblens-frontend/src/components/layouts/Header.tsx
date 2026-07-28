"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-md">
      <div className="container mx-auto max-w-5xl px-6 sm:px-16 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 shadow-sm transition-transform hover:scale-105">
              <span className="text-sm font-bold text-white">W</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 transition-colors hover:text-zinc-700">
              WebLens
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
