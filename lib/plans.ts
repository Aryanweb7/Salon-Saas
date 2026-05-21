import { PlanDefinition, type FeatureKey, type PlanId } from "@/lib/types";

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    staffLimit: 1,
    customerLimit: 50,
    reminderLimit: 20,
    emailLimit: 5,
    features: {
      birthdayCampaigns: false,
      revisitAutomation: false,
      advancedReports: false,
      commissionAnalytics: false,
      multiBranch: false,
      whiteLabel: false,
      customTemplates: false,
      exportReports: false,
      onlineBooking: false,
    },
  },
  basic: {
    id: "basic",
    name: "Basic",
    price: 999,
    staffLimit: 5,
    customerLimit: 500,
    reminderLimit: 100,
    emailLimit: 10,
    features: {
      birthdayCampaigns: false,
      revisitAutomation: false,
      advancedReports: false,
      commissionAnalytics: false,
      multiBranch: false,
      whiteLabel: false,
      customTemplates: false,
      exportReports: false,
      onlineBooking: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 1999,
    staffLimit: 10,
    customerLimit: null,
    reminderLimit: 500,
    emailLimit: 20,
    mostPopular: true,
    features: {
      birthdayCampaigns: true,
      revisitAutomation: true,
      advancedReports: true,
      commissionAnalytics: true,
      multiBranch: false,
      whiteLabel: false,
      customTemplates: false,
      exportReports: false,
      onlineBooking: true,
    },
  },
};

export function canUseFeature(planId: PlanId, feature: FeatureKey) {
  return PLAN_DEFINITIONS[planId].features[feature];
}
