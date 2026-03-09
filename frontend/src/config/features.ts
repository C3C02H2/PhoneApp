/**
 * FEATURE SYSTEM: "Do You Try?" Engagement & Retention
 *
 * ============================================================
 * FEATURE LIST (Ordered by priority)
 * ============================================================
 *
 * 1. DAILY STREAK SYSTEM
 *    - Consecutive days tracking
 *    - Visual streak counter with fire animation
 *    - Streak milestones: 7, 30, 100, 365 days
 *    - Streak recovery: 1 free "miss" per month
 *    Psychology: Loss aversion - users don't want to lose their streak
 *
 * 2. ACHIEVEMENT SYSTEM
 *    - Unlockable badges for milestones
 *    - "First Try" - first check-in
 *    - "Week Warrior" - 7 day streak
 *    - "Monthly Monster" - 30 day streak
 *    - "Century Club" - 100 day streak
 *    - "Year of Trying" - 365 day streak
 *    - "First Post" - published first post
 *    - "Inspirator" - 10 posts published
 *    Psychology: Endowed progress effect + collection instinct
 *
 * 3. SHAREABLE SCREENS
 *    - Streak milestone cards (beautiful dark design)
 *    - Daily check-in confirmation card
 *    - Achievement unlock card
 *    - "I tried for X days" stories format
 *    Psychology: Social proof + identity reinforcement
 *    Viral: Users share → friends see → download app
 *
 * 4. MOTIVATIONAL CHALLENGES
 *    - Weekly challenges: "Try something new every day this week"
 *    - Monthly themes: "February: The Month of Consistency"
 *    - Community challenges: collective goal
 *    Psychology: Goal gradient effect - closer to goal = more motivated
 *
 * 5. COMMUNITY POSTS
 *    - Blog/feed with motivational content
 *    - Like/react system (🔥 only - keep it minimal)
 *    - "Try of the Day" featured post
 *    Psychology: Social belonging + inspiration from peers
 *
 * ============================================================
 * USER PSYCHOLOGY PRINCIPLES
 * ============================================================
 *
 * 1. LOSS AVERSION
 *    Don't want to break streak → daily opens
 *
 * 2. VARIABLE REWARD
 *    Random motivational quotes after check-in
 *    Surprise achievements
 *
 * 3. IDENTITY REINFORCEMENT
 *    "You are a tryer" - not "you use a trying app"
 *    Language shapes behavior
 *
 * 4. SOCIAL PROOF
 *    "X people tried today"
 *    Community feed shows others trying
 *
 * 5. COMMITMENT & CONSISTENCY
 *    Small daily action → bigger commitment over time
 *    "I said yes" → "I must follow through"
 *
 * ============================================================
 * GAMIFICATION ELEMENTS
 * ============================================================
 *
 * - XP Points: 10 per check-in, 25 per post, 50 per milestone
 * - Levels: Starter → Tryer → Warrior → Legend → Icon
 * - Leaderboard: Top streaks this week/month
 * - Daily bonus: First check-in before 9 AM = 2x points
 *
 * ============================================================
 * RETENTION STRATEGY
 * ============================================================
 *
 * DAY 1: Welcome → First check-in → Achievement unlocked
 * DAY 3: Push notification: "Your streak is 3 days! Keep going!"
 * DAY 7: Achievement + shareable card + "You're a Week Warrior!"
 * DAY 14: "2 weeks of trying. Most people quit at day 3."
 * DAY 30: Major achievement + special badge + share prompt
 * DAY 60: "You're in the top 1% of tryers"
 * DAY 100: Century Club + permanent profile badge
 * DAY 365: "Year of Trying" - ultimate achievement
 *
 * DORMANT USERS (3+ days inactive):
 * - Day 3: "We miss you. Your streak was X days."
 * - Day 7: "It's never too late to try again."
 * - Day 14: "One tap. That's all it takes."
 *
 * ============================================================
 * VIRAL MECHANICS
 * ============================================================
 *
 * 1. Shareable streak cards → Instagram/TikTok stories
 * 2. "Challenge a friend" feature
 * 3. Invite code system: both get +50 XP
 * 4. Monthly community goal: "Together we tried 100,000 times"
 */

// Feature flags for gradual rollout
export const FEATURES = {
  // Core (MVP - already implemented)
  DAILY_CHECKIN: true,
  STREAK_TRACKING: true,
  BLOG_POSTS: true,
  USER_PROFILES: true,

  // Phase 2
  ACHIEVEMENTS: false,
  SHAREABLE_CARDS: false,

  // Phase 3
  PUSH_NOTIFICATIONS: true,
  CHALLENGES: false,
  REACTIONS: false,

  // Phase 4
  XP_SYSTEM: false,
  LEADERBOARD: false,
  INVITE_SYSTEM: false,
} as const;

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: 'first_try',
    title: 'First Try',
    description: 'Complete your first check-in',
    icon: '',
    requirement: { type: 'streak', value: 1 },
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: '7 consecutive days of trying',
    icon: '',
    requirement: { type: 'streak', value: 7 },
  },
  {
    id: 'monthly_monster',
    title: 'Monthly Monster',
    description: '30 consecutive days of trying',
    icon: '',
    requirement: { type: 'streak', value: 30 },
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: '100 consecutive days of trying',
    icon: '',
    requirement: { type: 'streak', value: 100 },
  },
  {
    id: 'year_of_trying',
    title: 'Year of Trying',
    description: '365 consecutive days of trying',
    icon: '',
    requirement: { type: 'streak', value: 365 },
  },
  {
    id: 'first_post',
    title: 'Storyteller',
    description: 'Publish your first post',
    icon: '',
    requirement: { type: 'posts', value: 1 },
  },
  {
    id: 'inspirator',
    title: 'Inspirator',
    description: 'Publish 10 posts',
    icon: '',
    requirement: { type: 'posts', value: 10 },
  },
] as const;

// Motivational messages after check-in (variable reward)
export const CHECKIN_MESSAGES = [
  "You showed up. That's what matters.",
  "Another day, another try. You're unstoppable.",
  "The compound effect is working in your favor.",
  "Most people don't even try. You're different.",
  "Consistency beats intensity. Always.",
  "Your future self thanks you.",
  "Small steps. Big results. Keep going.",
  "You're building something nobody can take away.",
  "Today's effort is tomorrow's foundation.",
  "The only failure is not trying.",
] as const;

// Level system
export const LEVELS = [
  { name: 'Starter', minXP: 0, icon: '' },
  { name: 'Tryer', minXP: 100, icon: '' },
  { name: 'Warrior', minXP: 500, icon: '' },
  { name: 'Legend', minXP: 2000, icon: '' },
  { name: 'Icon', minXP: 10000, icon: '' },
] as const;

