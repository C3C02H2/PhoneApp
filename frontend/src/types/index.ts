/**
 * TypeScript типове за приложението
 */

// === User ===
export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

// === Auth ===
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// === Post ===
export interface PostAuthor {
  id: string;
  username: string;
}

export const COMMUNITY_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'builders', label: 'Builders' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'study', label: 'Study' },
  { id: 'discipline', label: 'Discipline' },
  { id: 'creators', label: 'Creators' },
] as const;

export const POST_PROMPTS = [
  'What did you try today?',
  'What did you fail at today?',
  'What will you do tomorrow?',
  'What is holding you back?',
  'What small win did you have?',
] as const;

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  author: PostAuthor | null;
  is_anonymous: boolean;
  category: string | null;
  prompt: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  is_anonymous?: boolean;
  category?: string;
  prompt?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  is_active: boolean;
  is_private?: boolean;
  created_at: string;
  posts_count: number;
  total_likes_received: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_blocked?: boolean;
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  success_rate: number;
  comments_count: number;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  author: PostAuthor | null;
  parent_id: string | null;
  is_anonymous: boolean;
  created_at: string;
  replies: Comment[];
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
}

export interface CreateCommentRequest {
  content: string;
  parent_id?: string;
  is_anonymous?: boolean;
}

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

// === Goals ===
export interface Goal {
  id: string;
  title: string;
  description: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface GoalListResponse {
  goals: Goal[];
  total: number;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  color?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
}

// === Weekly Targets ===
export interface WeeklyTarget {
  id: string;
  title: string;
  target_count: number;
  current_count: number;
  week_start: string;
  created_at: string;
}

export interface WeeklyTargetListResponse {
  targets: WeeklyTarget[];
  week_start: string;
  week_end: string;
}

export interface CreateWeeklyTargetRequest {
  title: string;
  target_count?: number;
}

export interface UpdateWeeklyTargetRequest {
  title?: string;
  target_count?: number;
  current_count?: number;
}

// === Check-in Context (Yes details) ===
export interface CheckinContext {
  id: string;
  goal_id: string | null;
  what_i_tried: string | null;
  duration_minutes: number | null;
  note: string | null;
  next_step: string | null;
  mood: string | null;
  energy: number | null;
  created_at: string;
}

export interface CreateCheckinContext {
  goal_id?: string;
  what_i_tried?: string;
  duration_minutes?: number;
  note?: string;
  next_step?: string;
  mood?: string;
  energy?: number;
}

// === Excuse (No details) ===
export interface ExcuseData {
  id: string;
  category: string;
  detail: string | null;
  created_at: string;
}

export interface CreateExcuse {
  category: string;
  detail?: string;
}

export const EXCUSE_CATEGORIES = [
  { id: 'no_time', label: "I didn't have time" },
  { id: 'exhausted', label: 'I was exhausted' },
  { id: 'procrastinated', label: 'I procrastinated' },
  { id: 'didnt_know_where_to_start', label: "I didn't know where to start" },
  { id: 'other', label: 'Other' },
] as const;

export const MOOD_OPTIONS = [
  { id: 'great', label: 'Great' },
  { id: 'good', label: 'Good' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'low', label: 'Low' },
  { id: 'bad', label: 'Bad' },
] as const;

export const DURATION_OPTIONS = [
  { minutes: 5, label: '5 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1h+' },
] as const;

// === Check-in ===
export interface Checkin {
  id: string;
  user_id: string;
  checkin_date: string;
  answer: boolean;
  context: CheckinContext | null;
  excuse: ExcuseData | null;
  created_at: string;
}

export interface CheckinListResponse {
  checkins: Checkin[];
  total: number;
}

export interface CreateCheckinRequest {
  answer: boolean;
  context?: CreateCheckinContext;
  excuse?: CreateExcuse;
}

export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  total_no: number;
  success_rate: number;
  checked_in_today: boolean;
}

// === User Profile (see above) ===

export interface FollowResponse {
  following: boolean;
  followers_count: number;
  following_count: number;
}

export interface UserSearchResult {
  id: string;
  username: string;
  created_at: string;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
  total: number;
}

// === Navigation ===
export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Feed: undefined;
  Create: undefined;
  Chat: undefined;
  ProfileTab: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { sessionId: string };
  UserProfile: { userId: string };
  SearchUsers: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Goals: undefined;
  WeeklyTargets: undefined;
  Calendar: undefined;
  Dashboard: undefined;
  WeeklySummary: undefined;
  Settings: undefined;
  BlockedUsers: undefined;
  UserProfile: { userId: string };
};

export type FeedStackParamList = {
  FeedList: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

