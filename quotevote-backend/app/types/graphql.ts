/**
 * GraphQL Types
 * Types for GraphQL context, resolvers, and subscriptions
 */

import type { Request, Response } from 'express'
import type * as Common from './common'
import type * as Mongoose from './mongoose'

/**
 * PubSub type from graphql-subscriptions
 * Using generic type to avoid requiring the package as a dependency
 */
export type PubSub = any

// ============================================================================
// GraphQL Context
// ============================================================================

/**
 * GraphQL context available in all resolvers
 * Contains request/response objects, authenticated user, and utilities
 */
export interface GraphQLContext {
  /** Express request object */
  req: Request
  /** Express response object */
  res: Response
  /** Currently authenticated user (if any) */
  user?: Common.User | null
  /** PubSub instance for subscriptions */
  pubsub: PubSub
  /** Data loaders for batching/caching */
  loaders?: DataLoaders
  /** Request ID for tracing */
  requestId?: string
}

// ============================================================================
// Data Loaders
// ============================================================================

export interface DataLoaders {
  userLoader: any // DataLoader<string, Mongoose.UserDocument>
  postLoader: any // DataLoader<string, Mongoose.PostDocument>
  commentLoader: any // DataLoader<string, Mongoose.CommentDocument>
  voteLoader: any // DataLoader<string, Mongoose.VoteDocument>
  quoteLoader: any // DataLoader<string, Mongoose.QuoteDocument>
  messageRoomLoader: any // DataLoader<string, Mongoose.MessageRoomDocument>
  notificationLoader: any // DataLoader<string, Mongoose.NotificationDocument>
  // Add more loaders as needed
}

// ============================================================================
// Resolver Types
// ============================================================================

/**
 * Base resolver function type
 */
export type ResolverFn<TResult, TParent = any, TArgs = any> = (
  parent: TParent,
  args: TArgs,
  context: GraphQLContext,
  info: any
) => Promise<TResult> | TResult

/**
 * Resolver map for a specific type
 */
export type TypeResolvers<TSource = any> = {
  [field: string]: ResolverFn<any, TSource, any>
}

// ============================================================================
// Query Resolvers
// ============================================================================

export interface QueryResolvers {
  // User queries
  user: ResolverFn<Common.User | null, any, { username: string }>
  users: ResolverFn<Common.User[], any, { limit?: number; offset?: number }>
  searchUser: ResolverFn<Common.User[], any, { query: string }>
  getUserFollowInfo: ResolverFn<Common.User[], any, { username: string; filter: string }>
  checkDuplicateEmail: ResolverFn<boolean, any, { email: string }>
  
  // Post queries
  post: ResolverFn<Common.Post | null, any, { postId: string }>
  posts: ResolverFn<Common.PaginatedResult<Common.Post>, any, PostQueryArgs>
  featuredPosts: ResolverFn<Common.PaginatedResult<Common.Post>, any, PostQueryArgs>
  
  // Quote queries
  latestQuotes: ResolverFn<Common.Quote[], any, { limit: number }>
  
  // Group queries
  group: ResolverFn<Common.Group | null, any, { groupId: string }>
  groups: ResolverFn<Common.Group[], any, { limit: number }>
  
  // Activity queries
  activities: ResolverFn<Common.PaginatedResult<Common.Activity>, any, ActivityQueryArgs>
  
  // Notification queries
  notifications: ResolverFn<Common.Notification[]>
  
  // Message queries
  messages: ResolverFn<Common.Message[], any, { messageRoomId: string }>
  messageRoom: ResolverFn<Common.MessageRoom | null, any, { otherUserId: string }>
  messageRooms: ResolverFn<Common.MessageRoom[]>
  messageReactions: ResolverFn<Common.Reaction[], any, { messageId: string }>
  
  // Roster (buddy) queries
  buddyList: ResolverFn<Common.Roster[]>
  roster: ResolverFn<RosterQueryResult>
  
  // Action reactions
  actionReactions: ResolverFn<Common.Reaction[], any, { actionId: string }>
  
  // Search queries
  searchContent: ResolverFn<Common.Content[], any, { text: string }>
  searchCreator: ResolverFn<Common.Creator[], any, { text: string }>
  
  // Admin queries
  getBotReportedUsers: ResolverFn<Common.User[], any, { sortBy?: string; limit?: number }>
  
  // Token verification
  verifyUserPasswordResetToken: ResolverFn<boolean, any, { token: string }>
}

// ============================================================================
// Mutation Resolvers
// ============================================================================

export interface MutationResolvers {
  // User mutations
  followUser: ResolverFn<Common.User, any, { user_id: string; action: string }>
  updateUserPassword: ResolverFn<boolean, any, { username: string; password: string; token: string }>
  disableUser: ResolverFn<Common.User, any, { userId: string }>
  enableUser: ResolverFn<Common.User, any, { userId: string }>
  
  // Post mutations
  addPost: ResolverFn<Common.Post, any, { post: Common.PostInput }>
  deletePost: ResolverFn<Common.Post, any, { postId: string }>
  approvePost: ResolverFn<Common.Post, any, { postId: string; userId: string; remove?: boolean }>
  rejectPost: ResolverFn<Common.Post, any, { postId: string; userId: string; remove?: boolean }>
  reportPost: ResolverFn<Common.Post, any, { postId: string; userId: string }>
  updatePostBookmark: ResolverFn<Common.Post, any, { postId: string; userId: string }>
  toggleVoting: ResolverFn<Common.Post, any, { postId: string }>
  updateFeaturedSlot: ResolverFn<Common.Post, any, { postId: string; featuredSlot?: number }>
  
  // Comment mutations
  addComment: ResolverFn<Common.Comment, any, { comment: Common.CommentInput }>
  updateComment: ResolverFn<Common.Comment, any, { commentId: string; content: string }>
  deleteComment: ResolverFn<Common.Comment, any, { commentId: string }>
  
  // Vote mutations
  addVote: ResolverFn<Common.Vote, any, { vote: Common.VoteInput }>
  deleteVote: ResolverFn<Common.Vote, any, { voteId: string }>
  
  // Quote mutations
  addQuote: ResolverFn<Common.Quote, any, { quote: Common.QuoteInput }>
  deleteQuote: ResolverFn<Common.Quote, any, { quoteId: string }>
  
  // Message mutations
  createMessage: ResolverFn<Common.Message, any, { message: Common.MessageInput }>
  deleteMessage: ResolverFn<Common.Message, any, { messageId: string }>
  createPostMessageRoom: ResolverFn<Common.MessageRoom, any, { postId: string }>
  
  // Reaction mutations
  addActionReaction: ResolverFn<Common.Reaction, any, { reaction: Common.ReactionInput }>
  updateActionReaction: ResolverFn<Common.Reaction, any, { _id: string; emoji: string }>
  addMessageReaction: ResolverFn<Common.Reaction, any, { reaction: Common.ReactionInput }>
  updateReaction: ResolverFn<Common.Reaction, any, { _id: string; emoji: string }>
  
  // Group mutations
  createGroup: ResolverFn<Common.Group, any, { group: Common.GroupInput }>
  
  // Roster mutations
  addBuddy: ResolverFn<Common.Roster, any, { roster: Common.RosterInput }>
  acceptBuddy: ResolverFn<Common.Roster, any, { rosterId: string }>
  declineBuddy: ResolverFn<Common.Roster, any, { rosterId: string }>
  blockBuddy: ResolverFn<Common.Roster, any, { buddyId: string }>
  unblockBuddy: ResolverFn<Common.Roster, any, { buddyId: string }>
  removeBuddy: ResolverFn<MutationResult, any, { buddyId: string }>
  
  // Presence mutations
  heartbeat: ResolverFn<HeartbeatResult>
  updatePresence: ResolverFn<Common.Presence, any, { presence: Common.PresenceInput }>
  
  // Typing mutations
  updateTyping: ResolverFn<TypingResult, any, { typing: Common.TypingInput }>
  
  // Notification mutations
  removeNotification: ResolverFn<Common.Notification, any, { notificationId: string }>
  
  // Invite & Report mutations
  sendUserInvite: ResolverFn<MutationResult, any, { email: string }>
  requestUserAccess: ResolverFn<Common.UserInvite, any, { requestUserAccessInput: Common.RequestUserAccessInput }>
  reportUser: ResolverFn<MutationResult, any, { reportUserInput: Common.ReportUserInput }>
  reportBot: ResolverFn<boolean, any, { userId: string; reporterId: string }>
  
  // Email mutations
  sendPasswordResetEmail: ResolverFn<boolean, any, { email: string }>
  sendInvestorMail: ResolverFn<boolean, any, { email: string }>
}

// ============================================================================
// Subscription Resolvers
// ============================================================================

export interface SubscriptionResolvers {
  presence: SubscriptionResolver<Common.Presence, { userId?: string }>
  notification: SubscriptionResolver<Common.Notification, { userId: string }>
  message: SubscriptionResolver<Common.Message, { messageRoomId: string }>
  typing: SubscriptionResolver<TypingPayload, { messageRoomId: string }>
  roster: SubscriptionResolver<RosterPayload, { userId: string }>
}

/**
 * Generic subscription resolver type
 */
export type SubscriptionResolver<TPayload, TArgs = any> = {
  subscribe: ResolverFn<AsyncIterator<TPayload>, any, TArgs>
  resolve?: (payload: TPayload) => TPayload
}

// ============================================================================
// Field Resolvers
// ============================================================================

export interface PostResolvers extends TypeResolvers<Common.Post> {
  creator: ResolverFn<Common.User | null, Common.Post>
  comments: ResolverFn<Common.Comment[], Common.Post>
  votes: ResolverFn<Common.Vote[], Common.Post>
  quotes: ResolverFn<Common.Quote[], Common.Post>
  messageRoom: ResolverFn<Common.MessageRoom | null, Common.Post>
}

export interface CommentResolvers extends TypeResolvers<Common.Comment> {
  user: ResolverFn<Common.User | null, Common.Comment>
}

export interface VoteResolvers extends TypeResolvers<Common.Vote> {
  user: ResolverFn<Common.User | null, Common.Vote>
}

export interface QuoteResolvers extends TypeResolvers<Common.Quote> {
  user: ResolverFn<Common.User | null, Common.Quote>
}

export interface MessageResolvers extends TypeResolvers<Common.Message> {
  user: ResolverFn<Common.User | null, Common.Message>
}

export interface NotificationResolvers extends TypeResolvers<Common.Notification> {
  userBy: ResolverFn<Common.User | null, Common.Notification>
  post: ResolverFn<Common.Post | null, Common.Notification>
}

export interface ActivityResolvers extends TypeResolvers<Common.Activity> {
  user: ResolverFn<Common.User | null, Common.Activity>
  post: ResolverFn<Common.Post | null, Common.Activity>
  vote: ResolverFn<Common.Vote | null, Common.Activity>
  comment: ResolverFn<Common.Comment | null, Common.Activity>
  quote: ResolverFn<Common.Quote | null, Common.Activity>
}

export interface RosterResolvers extends TypeResolvers<Common.Roster> {
  buddy: ResolverFn<Common.User | null, Common.Roster>
}

export interface UserResolvers extends TypeResolvers<Common.User> {
  reputation: ResolverFn<Common.Reputation | null, Common.User>
}

// ============================================================================
// Complete Resolver Map
// ============================================================================

export interface Resolvers {
  Query: QueryResolvers
  Mutation: MutationResolvers
  Subscription: SubscriptionResolvers
  Post: PostResolvers
  Comment: CommentResolvers
  Vote: VoteResolvers
  Quote: QuoteResolvers
  Message: MessageResolvers
  Notification: NotificationResolvers
  Activity: ActivityResolvers
  Roster: RosterResolvers
  User: UserResolvers
}

// ============================================================================
// Query/Mutation Arguments
// ============================================================================

export interface PostQueryArgs {
  limit?: number
  offset?: number
  searchKey?: string
  startDateRange?: string
  endDateRange?: string
  friendsOnly?: boolean
  interactions?: boolean
  userId?: string
  sortOrder?: string
  groupId?: string
  approved?: boolean
  deleted?: boolean
}

export interface ActivityQueryArgs {
  user_id: string
  limit: number
  offset: number
  searchKey?: string
  startDateRange?: string
  endDateRange?: string
  activityEvent: Common.ActivityEventType[]
}

// ============================================================================
// Subscription Payloads
// ============================================================================

export interface TypingPayload {
  messageRoomId: string
  userId: string
  user?: Common.User
  isTyping: boolean
  timestamp: number
}

export interface RosterPayload {
  _id: string
  userId: string
  buddyId: string
  status: Common.RosterStatus
  initiatedBy?: string
  created: Date | string
  updated?: Date | string
  buddy?: Common.User
}

// ============================================================================
// Mutation Results
// ============================================================================

export interface MutationResult {
  success?: boolean
  code?: string
  message?: string
}

export interface HeartbeatResult {
  success: boolean
  timestamp: number
}

export interface TypingResult {
  success: boolean
  messageRoomId: string
  isTyping: boolean
}

export interface RosterQueryResult {
  buddies: Common.Roster[]
  pendingRequests: Common.Roster[]
  blockedUsers: Common.User[]
}

// ============================================================================
// Subscription Events/Channels
// ============================================================================

export const SUBSCRIPTION_EVENTS = {
  PRESENCE_UPDATED: 'PRESENCE_UPDATED',
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  MESSAGE_CREATED: 'MESSAGE_CREATED',
  MESSAGE_UPDATED: 'MESSAGE_UPDATED',
  MESSAGE_DELETED: 'MESSAGE_DELETED',
  TYPING_UPDATED: 'TYPING_UPDATED',
  ROSTER_UPDATED: 'ROSTER_UPDATED',
  POST_CREATED: 'POST_CREATED',
  POST_UPDATED: 'POST_UPDATED',
  POST_DELETED: 'POST_DELETED',
} as const

export type SubscriptionEvent = typeof SUBSCRIPTION_EVENTS[keyof typeof SUBSCRIPTION_EVENTS]
