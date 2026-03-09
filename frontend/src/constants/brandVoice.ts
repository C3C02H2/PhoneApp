export const BRAND = {
  welcome: {
    title: 'DoYouTry',
    subtitle: 'The only question that matters.',
    tagline: "It's not about winning. It's about showing up.",
    cta: 'Start Today',
  },

  checkin: {
    question: 'Did you try today?',
    yes_responses: [
      'Good. Now do it again tomorrow.',
      'That counts. Keep counting.',
      'One more day in the books.',
      'You showed up. That is rare.',
      'Consistency over intensity. Always.',
      'The streak continues. Stay hungry.',
      'Small steps. Big results.',
      'You tried. That puts you ahead of most.',
    ],
    no_responses: [
      "Honest answer. That's the first step.",
      "Tomorrow is a new chance. Don't waste it.",
      'Skipping one day is fine. Skipping two is a habit.',
      "Own it. Then change it.",
      'No judgment. Just awareness.',
      "Rest is valid. Giving up isn't.",
    ],
    missed_day: [
      'You missed a day. It happens.',
      "Silence doesn't mean failure.",
      'Come back stronger.',
    ],
  },

  reminders: {
    morning: 'New day. Same question. Did you try?',
    evening: "Day's almost over. Did you show up?",
    streak_risk: "Your streak is at risk. Don't let it slip.",
  },

  weekly: {
    great: 'Outstanding week. You showed up almost every day.',
    good: 'Solid week. More than half the days, you tried.',
    ok: 'A start. But you can do better.',
    low: 'One day is better than zero. But one day is not enough.',
    zero: "You didn't try this week. Only you can change that.",
  },

  achievements: {
    unlock_prefix: 'Achievement unlocked:',
  },

  empty_states: {
    no_posts: 'No posts yet. Be the first to share.',
    no_checkins: "You haven't checked in yet. Start today.",
    no_goals: "No focus areas set. What are you working on?",
    no_followers: "No followers yet. Stay consistent and they'll come.",
    no_following: "You're not following anyone yet.",
    no_comments: 'No comments yet. Start the conversation.',
    no_search_results: 'No results found.',
  },

  errors: {
    generic: 'Something went wrong. Try again.',
    network: 'Network error. Check your connection.',
    auth: 'Session expired. Please log in again.',
  },
} as const;
