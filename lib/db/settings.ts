import { eq } from "drizzle-orm";

import { db } from "@/db";
import { salons, settings } from "@/db/schema";

export type SalonSettingsConfig = {
  gstNumber?: string;
  taxBehavior?: string;
  receiptIdentity?: string;
  appointmentReminderTemplate?: string;
  revisitTemplate?: string;
  birthdayTemplate?: string;
  supportTemplate?: string;
  reminderHoursBefore?: number;
  revisitDaysAfter?: number;
  birthdaySendTime?: string;
};

export async function getSettingsSnapshot(salonId: string) {
  const [profile] = await db
    .select({
      salonName: salons.name,
      city: salons.city,
      brandingEnabled: settings.brandingEnabled,
      config: settings.config,
    })
    .from(salons)
    .leftJoin(settings, eq(settings.salonId, salons.id))
    .where(eq(salons.id, salonId))
    .limit(1);

  const config = (profile?.config ?? {}) as SalonSettingsConfig;

  return {
    salonName: profile?.salonName ?? "",
    city: profile?.city ?? "",
    brandingEnabled: profile?.brandingEnabled ?? false,
    config,
  };
}

export async function updateBusinessProfile(
  salonId: string,
  data: {
    salonName: string;
    city?: string;
    gstNumber?: string;
    taxBehavior?: string;
    receiptIdentity?: string;
    brandingEnabled: boolean;
  }
) {
  await db
    .update(salons)
    .set({
      name: data.salonName,
      city: data.city || null,
      updatedAt: new Date(),
    })
    .where(eq(salons.id, salonId));

  await upsertSettings(salonId, {
    brandingEnabled: data.brandingEnabled,
    config: {
      gstNumber: data.gstNumber || "",
      taxBehavior: data.taxBehavior || "inclusive",
      receiptIdentity: data.receiptIdentity || data.salonName,
    },
  });
}

export async function updateWhatsappSettings(
  salonId: string,
  data: {
    appointmentReminderTemplate?: string;
    revisitTemplate?: string;
    birthdayTemplate?: string;
    supportTemplate?: string;
    reminderHoursBefore: number;
    revisitDaysAfter: number;
    birthdaySendTime: string;
  }
) {
  await upsertSettings(salonId, {
    config: {
      appointmentReminderTemplate: data.appointmentReminderTemplate || "",
      revisitTemplate: data.revisitTemplate || "",
      birthdayTemplate: data.birthdayTemplate || "",
      supportTemplate: data.supportTemplate || "",
      reminderHoursBefore: data.reminderHoursBefore,
      revisitDaysAfter: data.revisitDaysAfter,
      birthdaySendTime: data.birthdaySendTime,
    },
  });
}

async function upsertSettings(
  salonId: string,
  data: {
    brandingEnabled?: boolean;
    config?: SalonSettingsConfig;
  }
) {
  const [existing] = await db
    .select({
      config: settings.config,
      brandingEnabled: settings.brandingEnabled,
    })
    .from(settings)
    .where(eq(settings.salonId, salonId))
    .limit(1);

  const nextConfig = {
    ...((existing?.config ?? {}) as SalonSettingsConfig),
    ...(data.config ?? {}),
  };

  await db
    .insert(settings)
    .values({
      salonId,
      brandingEnabled: data.brandingEnabled ?? existing?.brandingEnabled ?? false,
      multiBranchEnabled: false,
      config: nextConfig,
    })
    .onConflictDoUpdate({
      target: settings.salonId,
      set: {
        brandingEnabled: data.brandingEnabled ?? existing?.brandingEnabled ?? false,
        multiBranchEnabled: false,
        config: nextConfig,
        updatedAt: new Date(),
      },
    });
}
