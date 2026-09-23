/**
 * PostChatSend quote flow tests (issue #529)
 * A passage chosen with Quote in the selection popup is staged in the Discussion composer,
 * where the user can add an optional note before posting it.
 */

import { render, screen, fireEvent, waitFor, act } from '@/__tests__/utils/test-utils'
import PostChatSend from '@/components/PostChat/PostChatSend'
import { ADD_COMMENT, ADD_QUOTE, SEND_MESSAGE } from '@/graphql/mutations'
import { useAppStore } from '@/store'
import type { PendingQuote } from '@/types/store'

const mockAddComment = jest.fn()
const mockAddQuote = jest.fn()
const mockSendMessage = jest.fn()

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useMutation: (mutation: unknown) => {
    if (mutation === ADD_COMMENT) return [mockAddComment, { loading: false }]
    if (mutation === ADD_QUOTE) return [mockAddQuote, { loading: false }]
    if (mutation === SEND_MESSAGE) return [mockSendMessage, { loading: false }]
    return [jest.fn(), { loading: false }]
  },
}))

jest.mock('@/store', () => ({
  useAppStore: jest.fn(),
}))

jest.mock('@/hooks/useGuestGuard', () => ({
  __esModule: true,
  default: jest.fn(() => () => true),
}))

const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>
const mockSetPendingQuote = jest.fn()
const mockSetChatSubmitting = jest.fn()

const QUOTE: PendingQuote = {
  postId: 'post1',
  text: 'A good discussion platform should let readers point at a single sentence',
  startIndex: 80,
  endIndex: 152,
}

function mockStore(pendingQuote: PendingQuote | null) {
  mockUseAppStore.mockImplementation(((selector: (state: unknown) => unknown) =>
    selector({
      user: { data: { _id: 'user1', name: 'Dev', username: 'developer' } },
      chat: { submitting: false },
      ui: { pendingQuote },
      setChatSubmitting: mockSetChatSubmitting,
      setPendingQuote: mockSetPendingQuote,
    })) as unknown as typeof useAppStore)
}

function renderComposer() {
  return render(
    <PostChatSend
      messageRoomId="room1"
      title="Why passage-level reactions matter"
      postId="post1"
      postUrl="/post/qa/why-passage-level-reactions-matter/post1"
      postOwnerId="author1"
    />
  )
}

describe('PostChatSend quote flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddComment.mockResolvedValue({ data: { addComment: { _id: 'c1' } } })
    mockAddQuote.mockResolvedValue({ data: { addQuote: { _id: 'q1' } } })
    mockSendMessage.mockResolvedValue({ data: { createMessage: { _id: 'm1' } } })
  })

  it('shows the staged passage above the composer with a note placeholder', () => {
    mockStore(QUOTE)
    renderComposer()

    expect(screen.getByTestId('composer-quote')).toHaveTextContent(QUOTE.text)
    expect(screen.getByPlaceholderText('Add an optional note...')).toBeInTheDocument()
    expect(screen.getByLabelText('Optional note for your quote')).toBeInTheDocument()
  })

  it('ignores a passage staged from a different post', () => {
    mockStore({ ...QUOTE, postId: 'another-post' })
    renderComposer()

    expect(screen.queryByTestId('composer-quote')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Add to discussion...')).toBeInTheDocument()
  })

  it('moves focus to the note field when a passage is staged', () => {
    jest.useFakeTimers()
    try {
      mockStore(QUOTE)
      renderComposer()

      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(screen.getByPlaceholderText('Add an optional note...')).toHaveFocus()
    } finally {
      jest.useRealTimers()
    }
  })

  it('lets the user post a quote without a note', () => {
    mockStore(QUOTE)
    renderComposer()

    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled()
  })

  it('posts a Quote tied to the passage when no note is added', async () => {
    mockStore(QUOTE)
    renderComposer()

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => expect(mockAddQuote).toHaveBeenCalledTimes(1))
    expect(mockAddQuote).toHaveBeenCalledWith({
      variables: {
        quote: {
          quote: QUOTE.text,
          postId: 'post1',
          quoter: 'user1',
          quoted: 'author1',
          startWordIndex: 80,
          endWordIndex: 152,
        },
      },
    })
    expect(mockAddComment).not.toHaveBeenCalled()
    expect(mockSendMessage).not.toHaveBeenCalled()
    await waitFor(() => expect(mockSetPendingQuote).toHaveBeenCalledWith(null))
    expect(mockToastSuccess).toHaveBeenCalledWith('Quoted successfully')
  })

  it('posts a comment carrying the quote when a note is added', async () => {
    mockStore(QUOTE)
    renderComposer()

    fireEvent.change(screen.getByPlaceholderText('Add an optional note...'), {
      target: { value: '  This is the part that matters.  ' },
    })
    fireEvent.keyDown(screen.getByPlaceholderText('Add an optional note...'), { key: 'Enter' })

    await waitFor(() => expect(mockAddComment).toHaveBeenCalledTimes(1))
    expect(mockAddComment).toHaveBeenCalledWith({
      variables: {
        comment: {
          userId: 'user1',
          content: 'This is the part that matters.',
          startWordIndex: 80,
          endWordIndex: 152,
          postId: 'post1',
          url: '/post/qa/why-passage-level-reactions-matter/post1',
          quote: QUOTE.text,
        },
      },
    })
    expect(mockAddQuote).not.toHaveBeenCalled()
    await waitFor(() => expect(mockSetPendingQuote).toHaveBeenCalledWith(null))
    expect(mockToastSuccess).toHaveBeenCalledWith('Quote and note added')
  })

  it('keeps the staged passage and reports the error when posting fails', async () => {
    mockAddQuote.mockRejectedValueOnce(new Error('Network down'))
    mockStore(QUOTE)
    renderComposer()

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Error: Network down'))
    expect(mockSetPendingQuote).not.toHaveBeenCalled()
    expect(mockSetChatSubmitting).toHaveBeenLastCalledWith(false)
  })

  it('removes the staged passage', () => {
    mockStore(QUOTE)
    renderComposer()

    fireEvent.click(screen.getByRole('button', { name: 'Remove quoted passage' }))

    expect(mockSetPendingQuote).toHaveBeenCalledWith(null)
    expect(mockAddQuote).not.toHaveBeenCalled()
  })

  it('still sends a normal message when nothing is staged', async () => {
    mockStore(null)
    renderComposer()

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('Add to discussion...'), {
      target: { value: 'Plain message' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(1))
    expect(mockAddQuote).not.toHaveBeenCalled()
    expect(mockAddComment).not.toHaveBeenCalled()
  })
})
