"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-zinc-50 rounded-3xl border border-rose-100 shadow-sm mx-auto max-w-2xl my-12">
      <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-rose-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">
        Something went wrong!
      </h2>
      <p className="text-zinc-500 mb-8 max-w-md">
        We encountered an unexpected error while trying to render this section. 
        Don&apos;t worry, your data is safe.
      </p>
      <Button
        onClick={() => reset()}
        className="px-6 py-2 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors"
      >
        Try again
      </Button>
    </div>
  );
}