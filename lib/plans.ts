import { PlanDefinition, type FeatureKey, type PlanId } from "@/lib/types";

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free Trial",
    price: 0,
    billingInterval: "month",
    staffLimit: null,
    customerLimit: null,
    reminderLimit: null,
    emailLimit: null,
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
  basic: {
    id: "basic",
    name: "Basic",
    price: 999,
    billingInterval: "month",
    staffLimit: 10,
    customerLimit: null,
    reminderLimit: 500,
    emailLimit: 20,
    features: {
      birthdayCampaigns: true,
      revisitAutomation: true,
      advancedReports: true,
      commissionAnalytics: true,
      multiBranch: false,
      whiteLabel: false,
      customTemplates: false,
      exportReports: false,
      onlineBooking: false,
    },
  },
  pro: {
    id: "pro",
    name: "Annually",
    price: 9999,
    billingInterval: "year",
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
      onlineBooking: false,
    },
  },
};

export function canUseFeature(planId: PlanId, feature: FeatureKey) {
  return PLAN_DEFINITIONS[planId].features[feature];
}
