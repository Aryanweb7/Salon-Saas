export type Role = "SUPER_ADMIN" | "SALON_OWNER" | "STAFF_MEMBER" | "RECEPTIONIST";
export type PlanId = "basic" | "pro" | "premium";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "overdue"
  | "expired"
  | "canceled"
  | "paused";

export type FeatureKey =
  | "birthdayCampaigns"
  | "revisitAutomation"
  | "advancedReports"
  | "commissionAnalytics"
  | "multiBranch"
  | "whiteLabel"
  | "customTemplates"
  | "exportReports"
  | "onlineBooking";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  staffLimit: number | null;
  customerLimit: number | null;
  reminderLimit: number | null;
  mostPopular?: boolean;
  features: Record<FeatureKey, boolean>;
}

export interface SessionContext {
  user: { id: string; email: string; name: string } | null;
  role: Role;
  salonId: string | null;
  subscriptionStatus: SubscriptionStatus;
  planId: PlanId;
  readOnlyMode: boolean;
}
