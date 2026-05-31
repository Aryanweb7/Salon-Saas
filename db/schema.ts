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

export const roleEnum = pgEnum("role", ["SALON_OWNER", "STAFF_MEMBER", "RECEPTIONIST"]);
export const planEnum = pgEnum("plan_id", ["free", "basic", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "overdue", "expired", "canceled", "paused"]);
export const paymentStatusEnum = pgEnum("payment_status", ["created", "paid", "failed", "refunded"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"]);
export const messageStatusEnum = pgEnum("message_status", ["queued", "sent", "failed"]);

export const salons = pgTable(
  "salons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    ownerUserId: uuid("owner_user_id"),
    city: varchar("city", { length: 120 }),
    planId: planEnum("plan_id").default("free").notNull(),
    status: subscriptionStatusEnum("status").default("paused").notNull(),
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
    passwordHash: varchar("password_hash", { length: 255 }),
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

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    tokenIdx: uniqueIndex("password_reset_tokens_token_idx").on(table.tokenHash),
    userIdx: index("password_reset_tokens_user_idx").on(table.userId),
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
    status: subscriptionStatusEnum("status").default("paused").notNull(),
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

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoice_number", { length: 60 }).notNull(),
    invoiceDate: timestamp("invoice_date", { withTimezone: true }).defaultNow().notNull(),
    salonName: varchar("salon_name", { length: 160 }).notNull(),
    salonLogoUrl: text("salon_logo_url").default("").notNull(),
    salonAddress: text("salon_address").default("").notNull(),
    salonContactNumber: varchar("salon_contact_number", { length: 32 }).default("").notNull(),
    salonGstNumber: varchar("salon_gst_number", { length: 32 }).default("").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).default("").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountType: varchar("discount_type", { length: 20 }).default("fixed").notNull(),
    discountValue: numeric("discount_value", { precision: 12, scale: 2 }).default("0").notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0").notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    paymentStatus: varchar("payment_status", { length: 30 }).default("paid").notNull(),
    paymentMethod: varchar("payment_method", { length: 40 }).notNull(),
    pdfUrl: text("pdf_url").default("").notNull(),
    pdfPath: text("pdf_path").default("").notNull(),
    emailSent: boolean("email_sent").default(false).notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("invoices_salon_idx").on(table.salonId),
    invoiceNumberIdx: uniqueIndex("invoices_invoice_number_idx").on(table.invoiceNumber),
    salonInvoiceNumberIdx: index("invoices_salon_invoice_number_idx").on(table.salonId, table.invoiceNumber),
    invoiceDateIdx: index("invoices_invoice_date_idx").on(table.invoiceDate),
  }),
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 20 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("invoice_items_salon_idx").on(table.salonId),
    invoiceIdx: index("invoice_items_invoice_idx").on(table.invoiceId),
    kindIdx: index("invoice_items_kind_idx").on(table.kind),
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

export const smsLogs = pgTable(
  "sms_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    phone: varchar("phone", { length: 32 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 40 }).default("pending").notNull(),
    twilioSid: varchar("twilio_sid", { length: 255 }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("sms_logs_salon_idx").on(table.salonId),
    customerIdx: index("sms_logs_customer_idx").on(table.customerId),
    statusIdx: index("sms_logs_status_idx").on(table.status),
  }),
);

export const emailCampaignLogs = pgTable(
  "email_campaign_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    campaignId: uuid("campaign_id"),
    email: varchar("email", { length: 255 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    audience: varchar("audience", { length: 60 }).notNull(),
    status: varchar("status", { length: 40 }).default("sent").notNull(),
    error: text("error"),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("email_campaign_logs_salon_idx").on(table.salonId),
    customerIdx: index("email_campaign_logs_customer_idx").on(table.customerId),
    campaignIdx: index("email_campaign_logs_campaign_idx").on(table.campaignId),
    statusIdx: index("email_campaign_logs_status_idx").on(table.status),
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
  smsLogs: many(smsLogs),
  settings: one(settings),
}));
