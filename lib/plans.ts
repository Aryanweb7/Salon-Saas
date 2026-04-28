import { PlanDefinition, type FeatureKey, type PlanId } from "@/lib/types";

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  basic: {
    id: "basic",
    name: "Basic",
    price: 999,
    staffLimit: 3,
    customerLimit: 500,
    reminderLimit: 100,
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
  premium: {
    id: "premium",
    name: "Premium",
    price: 3999,
    staffLimit: null,
    customerLimit: null,
    reminderLimit: null,
    features: {
      birthdayCampaigns: true,
      revisitAutomation: true,
      advancedReports: true,
      commissionAnalytics: true,
      multiBranch: true,
      whiteLabel: true,
      customTemplates: true,
      exportReports: true,
      onlineBooking: true,
    },
  },
};

export function canUseFeature(planId: PlanId, feature: FeatureKey) {
  return PLAN_DEFINITIONS[planId].features[feature];
}
