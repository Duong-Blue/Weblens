import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2",
  {
    variants: {
      variant: {
        success:
          "border-transparent bg-green-500/10 text-green-600 hover:bg-green-500/20",
        warning:
          "border-transparent bg-red-100 text-red-600 hover:bg-red-200",
        info:
          "border-transparent bg-blue-50 text-blue-600 hover:bg-blue-100",
        neutral:
          "border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
