// Boost tiers — 5 levels. Prices are in USD per month.
// Yearly billing applies a 20% discount.

export type BoostTier = {
  id: string;
  name: string;
  monthlyUsd: number;
  durationDays: number;
  reach: string;
  benefits: string[];
  highlight?: boolean;
};

export const BOOST_TIERS: BoostTier[] = [
  {
    id: "spark",
    name: "Spark",
    monthlyUsd: 4.99,
    durationDays: 7,
    reach: "~5,000 impressions",
    benefits: ["7-day boost", "Feed mixing 1×", "Basic analytics"],
  },
  {
    id: "rise",
    name: "Rise",
    monthlyUsd: 12.99,
    durationDays: 14,
    reach: "~25,000 impressions",
    benefits: ["14-day boost", "Feed mixing 2×", "Country targeting", "Engagement report"],
  },
  {
    id: "wave",
    name: "Wave",
    monthlyUsd: 29.99,
    durationDays: 30,
    reach: "~120,000 impressions",
    benefits: ["30-day boost", "Feed mixing 3×", "Country targeting", "Priority in Explore"],
    highlight: true,
  },
  {
    id: "storm",
    name: "Storm",
    monthlyUsd: 79.99,
    durationDays: 30,
    reach: "~500,000 impressions",
    benefits: ["30-day boost", "Feed mixing 5×", "Multi-country targeting", "Top of Explore", "Profile badge"],
  },
  {
    id: "supernova",
    name: "Supernova",
    monthlyUsd: 199.99,
    durationDays: 30,
    reach: "~2M+ impressions",
    benefits: ["30-day boost", "Maximum feed weight", "Global targeting", "Push notification slot", "Dedicated support"],
  },
];

// Verification (KYC) tiers — grants verified badge for the duration.
export type VerifyTier = {
  id: string;
  name: string;
  monthlyUsd: number;
  durationDays: number;
  benefits: string[];
  highlight?: boolean;
};

export const VERIFY_TIERS: VerifyTier[] = [
  {
    id: "creator",
    name: "Creator Verified",
    monthlyUsd: 6.99,
    durationDays: 30,
    benefits: ["Blue check on profile", "Comment priority", "Reduced spam filtering"],
  },
  {
    id: "pro",
    name: "Pro Verified",
    monthlyUsd: 14.99,
    durationDays: 30,
    benefits: ["Blue check + Pro tag", "Search priority", "Profile link in bio", "Read receipts"],
    highlight: true,
  },
  {
    id: "business",
    name: "Business Verified",
    monthlyUsd: 49.99,
    durationDays: 30,
    benefits: ["Blue check + Business tag", "Top in Explore", "Verified comments highlight", "Customer support"],
  },
];

export const YEARLY_DISCOUNT = 0.2; // 20% off

export function priceFor(monthlyUsd: number, billing: "monthly" | "yearly"): number {
  if (billing === "yearly") {
    return Math.round(monthlyUsd * 12 * (1 - YEARLY_DISCOUNT) * 100) / 100;
  }
  return monthlyUsd;
}

export function durationFor(baseDays: number, billing: "monthly" | "yearly"): number {
  return billing === "yearly" ? 365 : baseDays;
}
