"use client";

import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApproveButtonProps } from "@/types/components";
import { POST_ACTION_PILL_CLASS } from "@/lib/constants/postActions";
import { cn } from "@/lib/utils";

/**
 * ApproveButton Component
 *
 * Whole-post approve control. Selected state is filled; unselected is outlined.
 */
export function ApproveButton({
  selected = false,
  count = 0,
  className,
  ...props
}: ApproveButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={selected}
      className={cn(
        POST_ACTION_PILL_CLASS,
        "border shadow-none gap-1 shrink-0",
        selected
          ? "bg-green-500 border-green-500 text-white hover:bg-green-600 hover:text-white dark:bg-green-600 dark:border-green-600 dark:hover:bg-green-500"
          : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/70 dark:hover:text-green-300",
        className
      )}
      {...props}
    >
      <ThumbsUp className="size-4" fill="currentColor" strokeWidth={1.5} />
      Approve
      <span className="tabular-nums font-bold">{count}</span>
    </Button>
  );
}
