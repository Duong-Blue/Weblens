"use client";

import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuthContext();

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

        <nav className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register">
                <Button className="font-medium shadow-sm transition-all hover:shadow-md">
                  Đăng ký
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50">
                  Bảng điều khiển
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-3 border-l border-zinc-200 pl-4">
                <span className="text-sm font-medium text-zinc-600">
                  {user?.email || 'Người dùng'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => logout()}
                  className="font-medium hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                  Đăng xuất
                </Button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
