/**
 * Achievement Badges System
 * Gamify donor engagement with milestone achievements
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  requirement: (stats: any) => boolean;
  unlockedAt?: string;
}

export const ACHIEVEMENT_BADGES: Badge[] = [
  {
    id: "first-donation",
    name: "Giving Start",
    description: "Make your first donation",
    emoji: "🎁",
    color: "#3b82f6",
    requirement: (stats) => stats.donationCount >= 1,
  },
  {
    id: "generous",
    name: "Generous Heart",
    description: "Donate $100 or more",
    emoji: "❤️",
    color: "#ef4444",
    requirement: (stats) => stats.totalDonated >= 100,
  },
  {
    id: "super-donor",
    name: "Super Donor",
    description: "Donate $500 or more",
    emoji: "🌟",
    color: "#f59e0b",
    requirement: (stats) => stats.totalDonated >= 500,
  },
  {
    id: "impact-champion",
    name: "Impact Champion",
    description: "Get 5+ donations verified for impact",
    emoji: "🏆",
    color: "#10b981",
    requirement: (stats) => stats.completedCount >= 5,
  },
  {
    id: "consistency",
    name: "Consistent Giver",
    description: "Make 10+ donations",
    emoji: "📈",
    color: "#8b5cf6",
    requirement: (stats) => stats.donationCount >= 10,
  },
  {
    id: "precision",
    name: "Precision Supporter",
    description: "Have 80%+ donation impact verified",
    emoji: "🎯",
    color: "#06b6d4",
    requirement: (stats) =>
      stats.donationCount > 0 &&
      stats.completedCount / stats.donationCount >= 0.8,
  },
  {
    id: "multi-cause",
    name: "Multi-Cause Champion",
    description: "Support 5+ different causes",
    emoji: "🌍",
    color: "#ec4899",
    requirement: (stats) => (stats.topCauses?.length || 0) >= 5,
  },
  {
    id: "thoughtful",
    name: "Thoughtful Giver",
    description: "Include messages in 5+ donations",
    emoji: "💭",
    color: "#14b8a6",
    requirement: (stats) => (stats.donationsWithNotes || 0) >= 5,
  },
];

export function getUnlockedBadges(stats: any): Badge[] {
  return ACHIEVEMENT_BADGES.filter((badge) => badge.requirement(stats));
}

export function getNextBadges(stats: any, count: number = 3): Badge[] {
  const unlocked = getUnlockedBadges(stats).map((b) => b.id);
  return ACHIEVEMENT_BADGES.filter(
    (badge) => !unlocked.includes(badge.id),
  ).slice(0, count);
}
