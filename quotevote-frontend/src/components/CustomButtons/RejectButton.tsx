"use client";

import { ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RejectButtonProps } from "@/types/components";
import { POST_ACTION_PILL_CLASS } from "@/lib/constants/postActions";
import { cn } from "@/lib/utils";

/**
 * RejectButton Component
 *
 * Whole-post reject control. Selected state is filled; unselected is outlined.
 */
export function RejectButton({
  selected = false,
  count = 0,
  className,
  ...props
}: RejectButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={selected}
      className={cn(
        POST_ACTION_PILL_CLASS,
        "border shadow-none gap-1 shrink-0",
        selected
          ? "bg-red-400 border-red-400 text-white hover:bg-red-500 hover:text-white dark:bg-red-500 dark:border-red-500 dark:hover:bg-red-400"
          : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/70 dark:hover:text-red-300",
        className
      )}
      {...props}
    >
      <ThumbsDown className="size-4" fill="currentColor" strokeWidth={1.5} />
      Reject
      <span className="tabular-nums font-bold">{count}</span>
    </Button>
  );
}
