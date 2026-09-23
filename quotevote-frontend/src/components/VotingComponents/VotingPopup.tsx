"use client";

import { useState } from "react";
import { Check, Heart, HeartCrack, Quote, ThumbsDown, ThumbsUp, Vote, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectionPopupMode, VoteResponseOption, VotingPopupProps } from "@/types/voting";

// Rows follow the design: positive on the left, negative on the right.
const VOTE_ROWS: [VoteResponseOption, VoteResponseOption][] = [
  [
    {
      type: "up",
      tags: "#agree",
      label: "Agree",
      icon: ThumbsUp,
      testId: "highlight-agree-button",
    },
    {
      type: "down",
      tags: "#disagree",
      label: "Disagree",
      icon: ThumbsDown,
      testId: "highlight-disagree-button",
    },
  ],
  [
    { type: "up", tags: "#true", label: "True", icon: Check, testId: "highlight-true-button" },
    { type: "down", tags: "#false", label: "False", icon: X, testId: "highlight-false-button" },
  ],
  [
    {
      type: "up",
      tags: "#like",
      label: "Like",
      icon: Heart,
      filledIcon: true,
      testId: "highlight-like-button",
    },
    {
      type: "down",
      tags: "#dislike",
      label: "Dislike",
      icon: HeartCrack,
      testId: "highlight-dislike-button",
    },
  ],
];

const VOTE_PANEL_ID = "selection-popup-vote-options";

/**
 * VotingPopup component
 * Selection popup with two mutually exclusive modes: Quote (send the passage to the
 * Discussion composer) and Vote (Agree/Disagree, True/False, Like/Dislike on the passage).
 */
export default function VotingPopup({
  onVote,
  onQuote,
  selectedText,
  userVote,
  onDeleteVote,
  onDismiss,
}: VotingPopupProps) {
  const [mode, setMode] = useState<SelectionPopupMode | null>(null);

  const hasVoted = Boolean(userVote);
  const voteLocked = hasVoted && !onDeleteVote;

  const handleQuote = () => {
    setMode("quote");
    onQuote(selectedText);
    onDismiss?.();
  };

  const handleVoteMode = () => {
    setMode((current) => (current === "vote" ? null : "vote"));
  };

  const handleResponse = (option: VoteResponseOption, active: boolean) => {
    if (voteLocked) return;
    if (active) {
      onDeleteVote?.();
    } else {
      onVote({ type: option.type, tags: option.tags });
    }
    onDismiss?.();
  };

  const isActiveVote = (option: VoteResponseOption) =>
    userVote?.type === option.type && userVote?.tags === option.tags;

  return (
    <div
      role="group"
      aria-label="Passage actions"
      data-testid="selection-popup"
      // Keep the text selection alive while pressing popup buttons with a mouse.
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        "w-[min(20rem,calc(100vw-1.25rem))] rounded-2xl border border-border",
        "bg-popover p-2 text-popover-foreground shadow-xl",
        "animate-in fade-in-0 zoom-in-95"
      )}
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="highlight-quote-button"
          aria-pressed={mode === "quote"}
          onClick={handleQuote}
          className={cn(
            "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border",
            "text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            mode === "quote"
              ? "border-info bg-info/15 font-semibold"
              : "border-transparent bg-muted hover:bg-accent"
          )}
        >
          <Quote className="size-5" aria-hidden="true" />
          Quote
        </button>
        <button
          type="button"
          data-testid="highlight-vote-mode-button"
          aria-pressed={mode === "vote"}
          aria-expanded={mode === "vote"}
          aria-controls={VOTE_PANEL_ID}
          onClick={handleVoteMode}
          className={cn(
            "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border",
            "text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            mode === "vote"
              ? "border-info bg-info/15 font-semibold"
              : "border-transparent bg-muted hover:bg-accent"
          )}
        >
          <Vote className="size-5" aria-hidden="true" />
          Vote
        </button>
      </div>

      {mode === "vote" && (
        <div
          id={VOTE_PANEL_ID}
          data-testid="highlight-vote-options"
          className="mt-2 border-t border-border pt-2 animate-in fade-in-0 slide-in-from-top-1"
        >
          {voteLocked && (
            <p className="mb-2 px-1 text-xs text-muted-foreground">
              You have already voted on this post.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {VOTE_ROWS.flat().map((option) => {
              const active = isActiveVote(option);
              const positive = option.type === "up";
              const Icon = option.icon;
              return (
                <button
                  key={option.tags}
                  type="button"
                  data-testid={option.testId}
                  aria-pressed={active}
                  aria-label={
                    active ? `${option.label} (your vote, press to remove)` : option.label
                  }
                  disabled={voteLocked}
                  onClick={() => handleResponse(option, active)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
                    "text-foreground transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    positive
                      ? "bg-upvote/10 hover:bg-upvote/20"
                      : "bg-downvote/10 hover:bg-downvote/20",
                    active
                      ? positive
                        ? "border-upvote bg-upvote/25 font-semibold"
                        : "border-downvote bg-downvote/25 font-semibold"
                      : "border-transparent"
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0",
                      positive ? "text-upvote" : "text-downvote",
                      option.filledIcon && "fill-current"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
