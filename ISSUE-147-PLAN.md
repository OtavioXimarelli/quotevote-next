# Issue #147 Subscription Runtime Plan

This document records the implementation plan followed for
[QuoteVote/quotevote-next#147](https://github.com/QuoteVote/quotevote-next/issues/147).

## Scope and decisions

The issue was treated as a runtime restoration task, not a mechanical legacy
file migration.

Retained subscription capabilities:

- `message(messageRoomId)`
- `presence(userId)`
- `typing(messageRoomId)`
- `notification(userId)`, because an existing backend publisher and frontend
  operation still use this capability

Retired capability:

- `roster(userId)` was removed rather than migrated, as required by #508's
  Roster/Buddy retirement decision.

The work was performed on `feat/issue-147-subscriptions`, created from
`main`.

## Implementation sequence

### 1. Establish the subscription contract

- Confirm the retained subscription fields and payload shapes.
- Add schema coverage for subscription registration.
- Remove the obsolete Roster subscription declaration from the backend schema,
  frontend schema, and frontend client operations.
- Keep broader Roster model and relationship cleanup under #508.

### 2. Replace the no-op pub/sub

- Replace the temporary no-op implementation with an in-memory async pub/sub
  implementation.
- Support event publication, callback subscriptions, explicit unsubscribe,
  async iterators, multiple subscribers, and iterator cleanup.
- Keep event names centralized through `SUBSCRIPTION_EVENTS`.

TDD sequence:

1. Add failing tests for event delivery, multiple subscribers, unsubscribe,
   iterator completion, and callback subscriptions.
2. Implement the smallest pub/sub utility that satisfies those tests.
3. Run the focused pub/sub tests and review cleanup behavior.

### 3. Implement subscription resolvers

- Add a dedicated `subscriptionResolver`.
- Register it in the executable GraphQL schema.
- Add message, presence, typing, and notification subscription resolvers.
- Enforce authentication for retained real-time capabilities.
- Enforce message-room access for message and typing subscriptions.
- Filter message and typing events by room.
- Filter presence and notification events by user.
- Use iterator-level filtering so events from unrelated rooms or users are not
  delivered.

TDD sequence:

1. Add resolver tests for registration, authentication, room filtering, and
   user filtering.
2. Implement the resolver and filtering logic.
3. Run focused resolver tests and review for cross-room or cross-user leakage.

### 4. Add typed WebSocket context

- Add `createWsContext`.
- Read authentication from WebSocket connection parameters.
- Support the frontend's `authToken` shape and Bearer token values.
- Verify the token and hydrate the user through the shared Prisma client.
- Provide Prisma, pub/sub, user identity, request ID, and connection
  parameters in the WebSocket context.
- Keep HTTP context behavior unchanged.

TDD sequence:

1. Add tests for authenticated context hydration.
2. Add tests for invalid or rejected tokens.
3. Implement the context factory.
4. Review compatibility with the canonical context from #153.

### 5. Wire the GraphQL WebSocket server

- Add `graphql-ws` and `ws` dependencies.
- Attach a WebSocket server to the existing HTTP server at `/graphql`.
- Use the executable GraphQL schema for WebSocket operations.
- Create WebSocket context from connection parameters.
- Dispose the WebSocket server during graceful shutdown.
- Avoid creating a second HTTP listener or using Express request/response
  objects in WebSocket context.
- Keep local development subscriptions enabled with
  `ws://localhost:4000/graphql`.

TDD sequence:

1. Add a lifecycle test for WebSocket server creation and disposal.
2. Implement the server wrapper.
3. Wire it into the existing server bootstrap and shutdown path.
4. Review listener ownership and shutdown ordering.

### 6. Align frontend subscription surfaces

- Remove the retired `ROSTER_SUBSCRIPTION` client operation.
- Remove the `roster` field from the checked-in frontend schema.
- Preserve the existing retained subscription operations and WebSocket client
  configuration.
- Avoid unrelated formatting or client retry changes.

### 7. Publish and verify retained events

- Publish `MESSAGE_CREATED` from the authenticated `createMessage` mutation.
- Persist the message before publishing it.
- Require authenticated room membership for message creation.
- Verify two connected WebSocket clients receive matching-room messages and
  unrelated-room messages are filtered.
- Verify notification subscriptions cannot target another user.

### 8. Review and validate

Review gates were applied after each significant piece:

1. Subscription contract and Roster retirement boundary.
2. Pub/sub delivery and cleanup behavior.
3. Resolver registration, authentication, and filtering.
4. WebSocket context authentication and dependency injection.
5. WebSocket server lifecycle and graceful shutdown.
6. Frontend/backend subscription surface compatibility.
7. Message publication and real two-client WebSocket delivery.
8. Local browser GraphQL compatibility and final diff review.

## Validation completed

Passing checks:

- Focused backend subscription, resolver, mapper, and post-query tests:
  - 5 suites
  - 40 tests
- Frontend localhost WebSocket configuration tests:
  - 1 suite
  - 8 tests
- Real two-client `graphql-ws` delivery coverage, including room filtering.
- Authenticated message persistence/publication coverage.
- Browser validation against the local stack:
  - `groups` and `topPosts` GraphQL requests returned HTTP 200.
  - The home page rendered without a GraphQL error state.
  - The browser console contained no errors or warnings after reload.
- ESLint for changed backend files.
- `git diff --check`.

The focused backend Jest command must be run with coverage disabled when
selecting only these suites; the repository-wide coverage thresholds are
intended for the complete test run and otherwise fail despite all selected
tests passing.
- ESLint for changed backend files.
- Prettier validation for changed frontend files.
- `git diff --check`.
- Branch ancestry verification against `main`.

The full backend type-check was also attempted. It remains blocked by
pre-existing Prisma/schema errors involving missing `tag` and `tagId` members,
presence fields, and an existing notification enum mismatch. Those errors are
outside this subscription change.

## Follow-up work not invented in this slice

- Roster model, blocking replacement, and broader Buddy UI retirement remain
  coordinated work for #508 and related issues.
