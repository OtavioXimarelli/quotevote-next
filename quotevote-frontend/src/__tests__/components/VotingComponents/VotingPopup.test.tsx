/**
 * VotingPopup component tests (issue #529: Quote / Vote selection popup)
 */

import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import VotingPopup from "@/components/VotingComponents/VotingPopup";
import type { VotingPopupProps } from "@/types/voting";

const selectedText = {
  startIndex: 10,
  endIndex: 42,
  text: "a single sentence worth quoting",
  points: 0,
};

function renderPopup(overrides: Partial<VotingPopupProps> = {}) {
  const props: VotingPopupProps = {
    onVote: jest.fn(),
    onQuote: jest.fn(),
    selectedText,
    userVote: null,
    onDeleteVote: jest.fn(),
    onDismiss: jest.fn(),
    ...overrides,
  };
  render(<VotingPopup {...props} />);
  return props;
}

const openVoteMode = () => fireEvent.click(screen.getByTestId("highlight-vote-mode-button"));

describe("VotingPopup", () => {
  it("shows Quote and Vote as the two primary actions and no Comment action", () => {
    renderPopup();

    expect(screen.getByRole("button", { name: "Quote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vote" })).toBeInTheDocument();
    expect(screen.queryByTestId("highlight-comment-button")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /comment/i })).not.toBeInTheDocument();
  });

  it("hides the vote responses until Vote is chosen", () => {
    renderPopup();

    expect(screen.queryByTestId("highlight-vote-options")).not.toBeInTheDocument();
    expect(screen.getByTestId("highlight-vote-mode-button")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByTestId("highlight-vote-mode-button")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("marks Vote as the active mode and reveals the three paired rows", () => {
    renderPopup();
    openVoteMode();

    const voteMode = screen.getByTestId("highlight-vote-mode-button");
    expect(voteMode).toHaveAttribute("aria-pressed", "true");
    expect(voteMode).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("highlight-quote-button")).toHaveAttribute("aria-pressed", "false");

    const options = screen.getByTestId("highlight-vote-options");
    expect(voteMode).toHaveAttribute("aria-controls", options.id);
    const labels = Array.from(options.querySelectorAll("button")).map((b) => b.textContent);
    // Positive on the left, negative on the right, row by row
    expect(labels).toEqual(["Agree", "Disagree", "True", "False", "Like", "Dislike"]);
  });

  it("collapses the vote responses when Vote is pressed again", () => {
    renderPopup();
    openVoteMode();
    openVoteMode();

    expect(screen.queryByTestId("highlight-vote-options")).not.toBeInTheDocument();
    expect(screen.getByTestId("highlight-vote-mode-button")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it.each([
    ["highlight-agree-button", "up", "#agree"],
    ["highlight-disagree-button", "down", "#disagree"],
    ["highlight-true-button", "up", "#true"],
    ["highlight-false-button", "down", "#false"],
    ["highlight-like-button", "up", "#like"],
    ["highlight-dislike-button", "down", "#dislike"],
  ])("applies %s as a %s vote tagged %s and closes the popup", (testId, type, tags) => {
    const props = renderPopup();
    openVoteMode();

    fireEvent.click(screen.getByTestId(testId));

    expect(props.onVote).toHaveBeenCalledWith({ type, tags });
    expect(props.onDeleteVote).not.toHaveBeenCalled();
    expect(props.onDismiss).toHaveBeenCalled();
  });

  it("shows the user's existing vote as pressed", () => {
    renderPopup({ userVote: { type: "up", tags: "#true" } });
    openVoteMode();

    expect(screen.getByTestId("highlight-true-button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("highlight-agree-button")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("highlight-like-button")).toHaveAttribute("aria-pressed", "false");
  });

  it("retracts the vote when the active response is pressed", () => {
    const props = renderPopup({ userVote: { type: "down", tags: "#dislike" } });
    openVoteMode();

    fireEvent.click(screen.getByTestId("highlight-dislike-button"));

    expect(props.onDeleteVote).toHaveBeenCalledTimes(1);
    expect(props.onVote).not.toHaveBeenCalled();
  });

  it("switches the vote when a different response is pressed", () => {
    const props = renderPopup({ userVote: { type: "up", tags: "#agree" } });
    openVoteMode();

    fireEvent.click(screen.getByTestId("highlight-like-button"));

    expect(props.onVote).toHaveBeenCalledWith({ type: "up", tags: "#like" });
    expect(props.onDeleteVote).not.toHaveBeenCalled();
  });

  it("locks the responses when the user has voted and vote changes are not supported", () => {
    const props = renderPopup({
      userVote: { type: "up", tags: "#agree" },
      onDeleteVote: undefined,
    });
    openVoteMode();

    expect(screen.getByText("You have already voted on this post.")).toBeInTheDocument();
    const like = screen.getByTestId("highlight-like-button");
    expect(like).toBeDisabled();
    fireEvent.click(like);
    expect(props.onVote).not.toHaveBeenCalled();
  });

  it("sends the selected passage to the composer and closes the popup on Quote", () => {
    const props = renderPopup();

    fireEvent.click(screen.getByTestId("highlight-quote-button"));

    expect(props.onQuote).toHaveBeenCalledWith(selectedText);
    expect(props.onDismiss).toHaveBeenCalled();
    expect(props.onVote).not.toHaveBeenCalled();
  });

  it("keeps Quote and Vote mutually exclusive", () => {
    renderPopup({ onDismiss: undefined });
    openVoteMode();

    fireEvent.click(screen.getByTestId("highlight-quote-button"));

    expect(screen.getByTestId("highlight-quote-button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("highlight-vote-mode-button")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.queryByTestId("highlight-vote-options")).not.toBeInTheDocument();
  });

  it("prevents mouse presses from clearing the text selection", () => {
    renderPopup();
    const popup = screen.getByTestId("selection-popup");

    const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    popup.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("is keyboard operable with native buttons", () => {
    renderPopup();

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => expect(button.tagName).toBe("BUTTON"));
    expect(screen.getByRole("group", { name: "Passage actions" })).toBeInTheDocument();
  });
});
