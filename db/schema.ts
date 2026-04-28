import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const roleEnum = pgEnum("role", ["SUPER_ADMIN", "SALON_OWNER", "STAFF_MEMBER", "RECEPTIONIST"]);
export const planEnum = pgEnum("plan_id", ["basic", "pro", "premium"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "past_due", "overdue", "expired", "canceled", "paused"]);
export const paymentStatusEnum = pgEnum("payment_status", ["created", "paid", "failed", "refunded"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"]);
export const messageStatusEnum = pgEnum("message_status", ["queued", "sent", "failed"]);
export const supportPriorityEnum = pgEnum("support_priority", ["low", "medium", "high"]);

export const salons = pgTable(
  "salons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    ownerUserId: uuid("owner_user_id"),
    city: varchar("city", { length: 120 }),
    planId: planEnum("plan_id").default("basic").notNull(),
    status: subscriptionStatusEnum("status").default("trial").notNull(),
    readOnlyMode: boolean("read_only_mode").default(false).notNull(),
    nextBillingDate: timestamp("next_billing_date", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    mrr: integer("mrr").default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    slugIdx: uniqueIndex("salons_slug_idx").on(table.slug),
    statusIdx: index("salons_status_idx").on(table.status),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
    salonId: uuid("salon_id").references(() => salons.id, { onDelete: "set null" }),
    branchId: uuid("branch_id"),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    role: roleEnum("role").default("SALON_OWNER").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    clerkIdx: uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId),
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    salonRoleIdx: index("users_salon_role_idx").on(table.salonId, table.role),
  }),
);

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    city: varchar("city", { length: 120 }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("branches_salon_idx").on(table.salonId),
  }),
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    planId: planEnum("plan_id").notNull(),
    status: subscriptionStatusEnum("status").default("trial").notNull(),
    razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 255 }),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    graceEndsAt: timestamp("grace_ends_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("subscriptions_salon_idx").on(table.salonId),
    statusIdx: index("subscriptions_status_idx").on(table.status),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: paymentStatusEnum("status").default("created").notNull(),
    provider: varchar("provider", { length: 60 }).default("Razorpay").notNull(),
    razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("payments_salon_idx").on(table.salonId),
    statusIdx: index("payments_status_idx").on(table.status),
  }),
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    email: varchar("email", { length: 255 }),
    birthday: timestamp("birthday", { mode: "date" }),
    gender: varchar("gender", { length: 30 }),
    preferredStaffId: uuid("preferred_staff_id"),
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("customers_salon_idx").on(table.salonId),
    phoneIdx: index("customers_phone_idx").on(table.salonId, table.phone),
  }),
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    staffId: uuid("staff_id"),
    serviceName: varchar("service_name", { length: 180 }).notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    status: appointmentStatusEnum("status").default("pending").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("appointments_salon_idx").on(table.salonId),
    dateIdx: index("appointments_start_idx").on(table.startAt),
  }),
);

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    staffId: uuid("staff_id"),
    serviceName: varchar("service_name", { length: 180 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 40 }),
    notes: text("notes"),
    visitedAt: timestamp("visited_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("visits_salon_idx").on(table.salonId),
    visitedIdx: index("visits_visited_idx").on(table.visitedAt),
  }),
);

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: varchar("name", { length: 160 }).notNull(),
    roleLabel: varchar("role_label", { length: 120 }).notNull(),
    commissionRate: integer("commission_rate").default(0).notNull(),
    attendanceRate: integer("attendance_rate").default(0).notNull(),
    salesTotal: integer("sales_total").default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("staff_salon_idx").on(table.salonId),
  }),
);

export const commissions = pgTable(
  "commissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
    visitId: uuid("visit_id").references(() => visits.id, { onDelete: "set null" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("commissions_salon_idx").on(table.salonId),
  }),
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    template: varchar("template", { length: 160 }).notNull(),
    provider: varchar("provider", { length: 60 }).notNull(),
    status: messageStatusEnum("status").default("queued").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("reminders_salon_idx").on(table.salonId),
    statusIdx: index("reminders_status_idx").on(table.status),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    reminderId: uuid("reminder_id").references(() => reminders.id, { onDelete: "set null" }),
    toPhone: varchar("to_phone", { length: 32 }).notNull(),
    templateKey: varchar("template_key", { length: 160 }).notNull(),
    provider: varchar("provider", { length: 60 }).notNull(),
    status: messageStatusEnum("status").default("queued").notNull(),
    referenceId: varchar("reference_id", { length: 255 }),
    payload: jsonb("payload").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("messages_salon_idx").on(table.salonId),
  }),
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").references(() => salons.id, { onDelete: "set null" }),
    subject: varchar("subject", { length: 200 }).notNull(),
    priority: supportPriorityEnum("priority").default("low").notNull(),
    status: varchar("status", { length: 40 }).default("open").notNull(),
    requesterName: varchar("requester_name", { length: 160 }),
    ...timestamps,
  },
  (table) => ({
    priorityIdx: index("support_tickets_priority_idx").on(table.priority),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").references(() => salons.id, { onDelete: "set null" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 200 }).notNull(),
    entityType: varchar("entity_type", { length: 120 }).notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    salonIdx: index("audit_logs_salon_idx").on(table.salonId),
  }),
);

export const settings = pgTable(
  "settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    brandingEnabled: boolean("branding_enabled").default(false).notNull(),
    multiBranchEnabled: boolean("multi_branch_enabled").default(false).notNull(),
    whatsappProvider: varchar("whatsapp_provider", { length: 60 }),
    config: jsonb("config").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    ...timestamps,
  },
  (table) => ({
    salonIdx: uniqueIndex("settings_salon_idx").on(table.salonId),
  }),
);

export const salonRelations = relations(salons, ({ many, one }) => ({
  users: many(users),
  branches: many(branches),
  subscriptions: many(subscriptions),
  payments: many(payments),
  customers: many(customers),
  appointments: many(appointments),
  visits: many(visits),
  staff: many(staff),
  reminders: many(reminders),
  messages: many(messages),
  tickets: many(supportTickets),
  settings: one(settings),
}));
