import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAchievement extends Document {
  id: string;
  category: 'learning' | 'engagement' | 'social' | 'ai' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  xpReward: number;
  requirement: {
    type: string;
    value: number;
  };
  isSecret: boolean;
  createdAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    enum: ['learning', 'engagement', 'social', 'ai', 'milestone'],
    required: true,
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze',
  },
  icon: {
    type: String,
    required: true,
  },
  xpReward: {
    type: Number,
    default: 50,
  },
  requirement: {
    type: { type: String },
    value: Number,
  },
  isSecret: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Achievement: Model<IAchievement> = mongoose.models.Achievement || mongoose.model<IAchievement>('Achievement', AchievementSchema);

export default Achievement;

// Predefined achievements
export const ACHIEVEMENTS = {
  // Learning achievements
  first_lesson: { id: 'first_lesson', category: 'learning', tier: 'bronze', icon: 'BookOpen', xpReward: 50, requirement: { type: 'lessons_completed', value: 1 } },
  lesson_streak_7: { id: 'lesson_streak_7', category: 'learning', tier: 'silver', icon: 'Flame', xpReward: 150, requirement: { type: 'current_streak', value: 7 } },
  lesson_streak_30: { id: 'lesson_streak_30', category: 'learning', tier: 'gold', icon: 'Flame', xpReward: 500, requirement: { type: 'current_streak', value: 30 } },
  lesson_streak_100: { id: 'lesson_streak_100', category: 'learning', tier: 'diamond', icon: 'Flame', xpReward: 2000, requirement: { type: 'current_streak', value: 100 } },
  first_course: { id: 'first_course', category: 'learning', tier: 'silver', icon: 'GraduationCap', xpReward: 200, requirement: { type: 'courses_completed', value: 1 } },
  course_master: { id: 'course_master', category: 'learning', tier: 'gold', icon: 'Trophy', xpReward: 500, requirement: { type: 'courses_completed', value: 5 } },
  study_10h: { id: 'study_10h', category: 'learning', tier: 'silver', icon: 'Clock', xpReward: 150, requirement: { type: 'total_hours', value: 10 } },
  study_50h: { id: 'study_50h', category: 'learning', tier: 'gold', icon: 'Clock', xpReward: 400, requirement: { type: 'total_hours', value: 50 } },
  study_100h: { id: 'study_100h', category: 'learning', tier: 'platinum', icon: 'Clock', xpReward: 1000, requirement: { type: 'total_hours', value: 100 } },
  
  // Engagement achievements
  daily_login_7: { id: 'daily_login_7', category: 'engagement', tier: 'bronze', icon: 'Calendar', xpReward: 100, requirement: { type: 'daily_logins', value: 7 } },
  daily_login_30: { id: 'daily_login_30', category: 'engagement', tier: 'silver', icon: 'Calendar', xpReward: 300, requirement: { type: 'daily_logins', value: 30 } },
  early_bird: { id: 'early_bird', category: 'engagement', tier: 'bronze', icon: 'Sun', xpReward: 50, requirement: { type: 'login_before_7am', value: 1 }, isSecret: true },
  night_owl: { id: 'night_owl', category: 'engagement', tier: 'bronze', icon: 'Moon', xpReward: 50, requirement: { type: 'login_after_11pm', value: 1 }, isSecret: true },
  
  // AI achievements
  first_image: { id: 'first_image', category: 'ai', tier: 'bronze', icon: 'Image', xpReward: 50, requirement: { type: 'images_generated', value: 1 } },
  image_creator: { id: 'image_creator', category: 'ai', tier: 'silver', icon: 'Image', xpReward: 150, requirement: { type: 'images_generated', value: 25 } },
  ai_artist: { id: 'ai_artist', category: 'ai', tier: 'gold', icon: 'Palette', xpReward: 400, requirement: { type: 'images_generated', value: 100 } },
  first_chat: { id: 'first_chat', category: 'ai', tier: 'bronze', icon: 'MessageSquare', xpReward: 50, requirement: { type: 'ai_chats', value: 1 } },
  ai_conversationalist: { id: 'ai_conversationalist', category: 'ai', tier: 'silver', icon: 'MessageSquare', xpReward: 200, requirement: { type: 'ai_chats', value: 50 } },
  
  // Social achievements
  first_referral: { id: 'first_referral', category: 'social', tier: 'silver', icon: 'Users', xpReward: 300, requirement: { type: 'referrals', value: 1 } },
  influencer: { id: 'influencer', category: 'social', tier: 'gold', icon: 'Share2', xpReward: 800, requirement: { type: 'referrals', value: 10 } },
  
  // Milestone achievements
  level_5: { id: 'level_5', category: 'milestone', tier: 'silver', icon: 'Star', xpReward: 200, requirement: { type: 'level', value: 5 } },
  level_10: { id: 'level_10', category: 'milestone', tier: 'gold', icon: 'Star', xpReward: 500, requirement: { type: 'level', value: 10 } },
  level_25: { id: 'level_25', category: 'milestone', tier: 'platinum', icon: 'Crown', xpReward: 1500, requirement: { type: 'level', value: 25 } },
  xp_1000: { id: 'xp_1000', category: 'milestone', tier: 'silver', icon: 'Zap', xpReward: 100, requirement: { type: 'total_xp', value: 1000 } },
  xp_10000: { id: 'xp_10000', category: 'milestone', tier: 'gold', icon: 'Zap', xpReward: 500, requirement: { type: 'total_xp', value: 10000 } },
};

// Daily challenges pool
export const DAILY_CHALLENGES = [
  { id: 'complete_lesson', description: 'Complete 1 lesson today', reward: 25, requirement: { type: 'lessons_today', value: 1 } },
  { id: 'complete_3_lessons', description: 'Complete 3 lessons today', reward: 75, requirement: { type: 'lessons_today', value: 3 } },
  { id: 'study_30min', description: 'Study for 30 minutes', reward: 50, requirement: { type: 'study_minutes', value: 30 } },
  { id: 'study_1h', description: 'Study for 1 hour', reward: 100, requirement: { type: 'study_minutes', value: 60 } },
  { id: 'generate_image', description: 'Generate 1 AI image', reward: 30, requirement: { type: 'images_today', value: 1 } },
  { id: 'generate_3_images', description: 'Generate 3 AI images', reward: 75, requirement: { type: 'images_today', value: 3 } },
  { id: 'explore_tool', description: 'Explore a new AI tool', reward: 40, requirement: { type: 'tools_visited', value: 1 } },
  { id: 'share_creation', description: 'Share a creation publicly', reward: 60, requirement: { type: 'shares_today', value: 1 } },
];

// Weekly missions for Pro users
export const WEEKLY_MISSIONS = [
  { id: 'complete_module', description: 'Complete a full course module', reward: 200 },
  { id: 'perfect_week', description: 'Maintain your streak for 7 days', reward: 300 },
  { id: 'ai_master', description: 'Use 5 different AI tools', reward: 150 },
  { id: 'content_creator', description: 'Generate 10 AI images', reward: 175 },
  { id: 'community_hero', description: 'Help 3 community members', reward: 250 },
];
