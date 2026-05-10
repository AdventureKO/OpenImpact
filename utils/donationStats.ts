/**
 * Donation filtering, stats, and analytics utilities
 */

export interface Donation {
  id: string;
  amount?: number;
  projectId?: string | null;
  createdAt?: string;
  journeyStep?: number;
  allocationCategory?: string | null;
}

export interface DonationStats {
  totalDonated: number;
  averageDonation: number;
  largestDonation: number;
  smallestDonation: number;
  donationCount: number;
  completedCount: number;
  inProgressCount: number;
  topCauses: Array<{ causeId: string; total: number; count: number }>;
}

export interface FilterOptions {
  minAmount?: number;
  maxAmount?: number;
  causeId?: string | null;
  journeyStage?: number | null;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

/**
 * Calculate comprehensive donation statistics
 */
export function calculateStats(donations: Donation[]): DonationStats {
  if (!donations || donations.length === 0) {
    return {
      totalDonated: 0,
      averageDonation: 0,
      largestDonation: 0,
      smallestDonation: 0,
      donationCount: 0,
      completedCount: 0,
      inProgressCount: 0,
      topCauses: [],
    };
  }

  const amounts = donations
    .map((d) => Number(d.amount || 0))
    .filter((a) => a > 0);

  const totalDonated = amounts.reduce((s, a) => s + a, 0);
  const donationCount = donations.length;
  const completedCount = donations.filter((d) => d.journeyStep === 4).length;
  const inProgressCount = donationCount - completedCount;

  // Calculate top causes
  const causeMap: Record<string, { total: number; count: number }> = {};
  donations.forEach((d) => {
    const cause = String(d.projectId || "unallocated");
    if (!causeMap[cause]) causeMap[cause] = { total: 0, count: 0 };
    causeMap[cause].total += Number(d.amount || 0);
    causeMap[cause].count += 1;
  });

  const topCauses = Object.entries(causeMap)
    .map(([causeId, data]) => ({ causeId, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalDonated,
    averageDonation: Math.round((totalDonated / donationCount) * 100) / 100,
    largestDonation: Math.max(...amounts),
    smallestDonation: Math.min(...amounts),
    donationCount,
    completedCount,
    inProgressCount,
    topCauses,
  };
}

/**
 * Filter donations based on criteria
 */
export function filterDonations(
  donations: Donation[],
  options: FilterOptions,
): Donation[] {
  if (!donations) return [];

  return donations.filter((d) => {
    const amount = Number(d.amount || 0);

    // Amount filtering
    if (options.minAmount !== undefined && amount < options.minAmount) {
      return false;
    }
    if (options.maxAmount !== undefined && amount > options.maxAmount) {
      return false;
    }

    // Cause filtering
    if (options.causeId !== undefined && options.causeId !== null) {
      if (String(d.projectId || "") !== String(options.causeId)) {
        return false;
      }
    }

    // Journey stage filtering
    if (options.journeyStage !== undefined && options.journeyStage !== null) {
      if (Number(d.journeyStep || 0) !== options.journeyStage) {
        return false;
      }
    }

    // Date range filtering
    const donationDate = new Date(d.createdAt || 0).getTime();
    if (options.startDate) {
      if (donationDate < new Date(options.startDate).getTime()) {
        return false;
      }
    }
    if (options.endDate) {
      if (donationDate > new Date(options.endDate).getTime()) {
        return false;
      }
    }

    // Search query filtering
    if (options.searchQuery) {
      const q = String(options.searchQuery).toLowerCase().trim();
      const searchText =
        `${d.projectId || ""} ${d.allocationCategory || ""}`.toLowerCase();
      if (!searchText.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort donations with various strategies
 */
export function sortDonations(
  donations: Donation[],
  sortBy: "recent" | "oldest" | "highest" | "lowest" = "recent",
): Donation[] {
  const sorted = [...donations];

  switch (sortBy) {
    case "recent":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    case "oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime(),
      );
    case "highest":
      return sorted.sort(
        (a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0),
      );
    case "lowest":
      return sorted.sort(
        (a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0),
      );
    default:
      return sorted;
  }
}

/**
 * Group donations by period (month, week, etc.)
 */
export function groupByPeriod(
  donations: Donation[],
  period: "day" | "week" | "month" | "year" = "month",
): Record<string, Donation[]> {
  const groups: Record<string, Donation[]> = {};

  donations.forEach((d) => {
    const date = new Date(d.createdAt || 0);
    let key = "";

    switch (period) {
      case "day":
        key = date.toLocaleDateString();
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.toLocaleDateString()}`;
        break;
      case "month":
        key = date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        break;
      case "year":
        key = date.getFullYear().toString();
        break;
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });

  return groups;
}

/**
 * Get donation insights/recommendations
 */
export function getDonationInsights(donations: Donation[]): {
  insight: string;
  emoji: string;
  color: string;
}[] {
  const stats = calculateStats(donations);
  const insights: {
    insight: string;
    emoji: string;
    color: string;
  }[] = [];

  if (stats.donationCount >= 10) {
    insights.push({
      emoji: "🌟",
      insight: `You're a committed supporter with ${stats.donationCount} donations!`,
      color: "#fbbf24",
    });
  }

  if (stats.completedCount > 0) {
    const percentage = Math.round(
      (stats.completedCount / stats.donationCount) * 100,
    );
    insights.push({
      emoji: "✅",
      insight: `${percentage}% of your donations have verified impact.`,
      color: "#10b981",
    });
  }

  if (stats.topCauses.length > 0) {
    const topCause = stats.topCauses[0];
    insights.push({
      emoji: "🎯",
      insight: `You've donated $${topCause.total.toFixed(2)} to your top cause.`,
      color: "#3b82f6",
    });
  }

  if (stats.averageDonation > 0) {
    insights.push({
      emoji: "📊",
      insight: `Your average donation is $${stats.averageDonation.toFixed(2)}.`,
      color: "#8b5cf6",
    });
  }

  return insights;
}
