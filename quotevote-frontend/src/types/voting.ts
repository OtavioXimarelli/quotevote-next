/**
 * Voting-related TypeScript types
 * Types for voting components and vote-related data structures
 */

import type { LucideIcon } from "lucide-react";
import type { PostVote } from "./post";
import type { ParsedSelection } from "./store";

/**
 * Vote type (upvote or downvote)
 */
export type VoteType = "up" | "down";

/**
 * Vote option tags
 */
export type VoteOption = "#true" | "#agree" | "#like" | "#false" | "#disagree" | "#dislike";

/**
 * Voted by entry structure
 */
export interface VotedByEntry {
  userId: string;
  type: VoteType;
  _id?: string;
  [key: string]: unknown;
}

/**
 * Selected text structure from parser
 */
export interface SelectedText extends ParsedSelection {
  startIndex: number;
  endIndex: number;
  text: string;
  points?: number;
}

/**
 * Vote handler function type
 */
export type VoteHandler = (vote: { type: VoteType; tags: VoteOption }) => void;

/**
 * Quote handler function type. Receives the passage to place in the Discussion composer.
 */
export type QuoteHandler = (selection: SelectedText) => void;

/**
 * Mutually exclusive modes of the selection popup (issue #529)
 */
export type SelectionPopupMode = "quote" | "vote";

/**
 * One response row cell in the popup's Vote mode
 */
export interface VoteResponseOption {
  type: VoteType;
  tags: VoteOption;
  label: string;
  icon: LucideIcon;
  /** Render the icon filled (the design's solid heart) */
  filledIcon?: boolean;
  testId: string;
}

/**
 * The current user's existing vote on the post, if any
 */
export interface UserVote {
  type: VoteType;
  tags?: string | null;
}

/**
 * Controls VotingBoard passes to its popup render prop
 */
export interface SelectionPopupControls {
  /** Clears the text selection and hides the popup */
  dismiss: () => void;
}

/**
 * Props for the VotingBoard helper that renders the popup render prop
 */
export interface SelectionPopupContentProps {
  render: (selection: SelectedText, controls: SelectionPopupControls) => React.ReactNode;
  selection: SelectedText;
  dismiss: () => void;
}

/**
 * Selection handler function type
 */
export type SelectionHandler = (selection: SelectedText) => void;

/**
 * VotingPopup component props
 */
export interface VotingPopupProps {
  /**
   * Handler function called when a vote response is chosen
   */
  onVote: VoteHandler;
  /**
   * Handler function called when Quote is chosen
   */
  onQuote: QuoteHandler;
  /**
   * Currently selected text
   */
  selectedText: SelectedText;
  /**
   * The current user's existing vote on this post (null if none)
   */
  userVote?: UserVote | null;
  /**
   * Handler function called when a vote is retracted/deleted.
   * Without it, a user who already voted can't change their vote.
   */
  onDeleteVote?: () => void;
  /**
   * Hides the popup and clears the selection
   */
  onDismiss?: () => void;
}

/**
 * Explicit delayed-mobile selection state machine (issue #484).
 */
export type SelectionPhase = "idle" | "native" | "toolbar";

/**
 * VotingBoard component props
 */
export interface VotingBoardProps {
  /**
   * Top offset for positioning the popover
   */
  topOffset?: number;
  /**
   * Handler function called when text is selected
   */
  onSelect?: SelectionHandler;
  /**
   * Handler called when selection is dismissed (background tap, reset, mode change).
   * Parent should clear its selectedText to empty indices/text.
   */
  onDeselect?: () => void;
  /**
   * Whether to show highlights for votes/comments
   */
  highlights?: boolean;
  /**
   * The content text to display and make selectable
   */
  content: string;
  /**
   * Render prop function that receives selection data
   */
  children?: (selection: SelectedText, controls: SelectionPopupControls) => React.ReactNode;
  /**
   * Array of votes to highlight
   */
  votes?: PostVote[];
  /**
   * Additional style props
   */
  style?: React.CSSProperties;
  /**
   * Focused comment data (optional, for highlighting specific comment ranges)
   */
  focusedComment?: {
    startWordIndex: number;
    endWordIndex: number;
    actionId?: string;
  } | null;
  /**
   * Called when the highlighted (linked) passage is tapped.
   */
  onHighlightClick?: () => void;
}

/**
 * SelectionPopover component props — pure portal/positioning (issue #484).
 * No selection polling, no onSelect/onDeselect. Owner (VotingBoard) resolves the anchor.
 */
export interface SelectionPopoverProps {
  /**
   * Whether to show the popover
   */
  showPopover: boolean;
  /**
   * Top offset for positioning
   */
  topOffset?: number;
  /**
   * Resolve the current anchor rectangle for positioning.
   * Desktop: live browser range rect; Mobile toolbar: retained mark rect or cached native rect.
   */
  resolveAnchorRect: () => DOMRect | null;
  /**
   * Ref to the popover element (owned by VotingBoard)
   */
  popoverRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Additional style props
   */
  style?: React.CSSProperties;
  /**
   * Child components to render inside the popover
   */
  children: React.ReactNode;
}
