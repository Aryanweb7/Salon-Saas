/**
 * Admin Dashboard Utility Functions
 * Calculate metrics and format data for admin views
 */

export type HealthStatus = "green" | "yellow" | "red";

/**
 * Calculate churn rate percentage
 */
export function calculateChurnRate(totalSalons: number, churnedSalons: number): number {
  if (totalSalons === 0) return 0;
  return Math.round((churnedSalons / totalSalons) * 100);
}

/**
 * Determine client health based on subscription status and activity
 */
export function calculateClientHealth(
  subscriptionStatus: string,
  lastLoginDays: number | null
): HealthStatus {
  if (!subscriptionStatus) return "red";

  // Red flags: overdue, expired, canceled, paused
  if (
    ["overdue", "expired", "canceled", "paused"].includes(
      subscriptionStatus.toLowerCase()
    )
  ) {
    return "red";
  }

  // Yellow: trial or no recent login
  if (
    subscriptionStatus.toLowerCase() === "trial" ||
    (lastLoginDays && lastLoginDays > 14)
  ) {
    return "yellow";
  }

  // Green: active and recent login
  return "green";
}

/**
 * Format trend string with direction
 */
export function formatMetricTrend(
  current: number,
  previous: number
): { value: number; isPositive: boolean } {
  const diff = current - previous;
  const percentChange =
    previous === 0 ? 0 : Math.round((diff / previous) * 100);

  return {
    value: Math.abs(percentChange),
    isPositive: diff >= 0,
  };
}

/**
 * Calculate trial conversion funnel
 */
export function calculateTrialConversionFunnel(
  totalSignups: number,
  trialsStarted: number,
  converted: number,
  dropped: number
) {
  return {
    signups: totalSignups,
    signupPercent: 100,
    trials: trialsStarted,
    trialsPercent: totalSignups > 0 ? Math.round((trialsStarted / totalSignups) * 100) : 0,
    converted: converted,
    convertedPercent:
      trialsStarted > 0 ? Math.round((converted / trialsStarted) * 100) : 0,
    dropped: dropped,
    droppedPercent:
      trialsStarted > 0 ? Math.round((dropped / trialsStarted) * 100) : 0,
  };
}

/**
 * Format currency amount
 */
export function formatCurrencyValue(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate days since date
 */
export function daysSinceDate(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get subscription status color
 */
export function getSubscriptionStatusColor(
  status: string
): "blue" | "green" | "yellow" | "red" {
  switch (status.toLowerCase()) {
    case "active":
      return "green";
    case "trial":
      return "blue";
    case "past_due":
      return "yellow";
    case "overdue":
    case "expired":
    case "canceled":
    case "paused":
      return "red";
    default:
      return "blue";
  }
}

/**
 * Calculate average plan value
 */
export function calculateAveragePlanValue(
  totalRevenue: number,
  activeSalons: number
): number {
  if (activeSalons === 0) return 0;
  return Math.round(totalRevenue / activeSalons);
}
