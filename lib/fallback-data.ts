import type { PlanId, SessionContext, SubscriptionStatus } from "@/lib/types";

export const fallbackSession: Record<"superAdmin" | "salonOwner", SessionContext> = {
  superAdmin: {
    user: { id: "00000000-0000-0000-0000-000000000001", email: "owner@salonflow.in", name: "Platform Owner" },
    role: "SUPER_ADMIN",
    salonId: null,
    subscriptionStatus: "active",
    planId: "premium",
    readOnlyMode: false,
  },
  salonOwner: {
    user: { id: "00000000-0000-0000-0000-000000000002", email: "owner@glowstudio.in", name: "Ananya Kapoor" },
    role: "SALON_OWNER",
    salonId: "11111111-1111-1111-1111-111111111111",
    subscriptionStatus: "active",
    planId: "pro",
    readOnlyMode: false,
  },
};

export const fallbackSalons = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Glow Studio", owner: "Ananya Kapoor", city: "Mumbai", plan: "pro", status: "active", renewalDate: "2026-05-03", lastLogin: "2 hours ago", mrr: 1999 },
  { id: "22222222-2222-2222-2222-222222222222", name: "Royal Clippers", owner: "Rahul Sharma", city: "Delhi", plan: "basic", status: "trial", renewalDate: "2026-05-01", lastLogin: "today", mrr: 999 },
  { id: "33333333-3333-3333-3333-333333333333", name: "Velvet Beauty Bar", owner: "Ishita Rao", city: "Bengaluru", plan: "premium", status: "active", renewalDate: "2026-05-18", lastLogin: "1 day ago", mrr: 3999 },
  { id: "44444444-4444-4444-4444-444444444444", name: "Urban Trim Lab", owner: "Arjun Mehta", city: "Pune", plan: "pro", status: "past_due", renewalDate: "2026-04-20", lastLogin: "5 days ago", mrr: 1999 },
  { id: "55555555-5555-5555-5555-555555555555", name: "Aura Groom House", owner: "Naina Khanna", city: "Jaipur", plan: "basic", status: "overdue", renewalDate: "2026-04-16", lastLogin: "8 days ago", mrr: 999 },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  owner: string;
  city: string;
  plan: PlanId;
  status: SubscriptionStatus;
  renewalDate: string;
  lastLogin: string;
  mrr: number;
}>;

export const fallbackOwnerStats = {
  totalCustomers: 846,
  todayAppointments: 24,
  monthRevenue: 188500,
  pendingReminders: 38,
  staffCount: 9,
  returningCustomers: 67,
};

export const fallbackRevenueSeries = [
  { name: "Jan", revenue: 98000, visits: 302 },
  { name: "Feb", revenue: 124000, visits: 351 },
  { name: "Mar", revenue: 143000, visits: 398 },
  { name: "Apr", revenue: 188500, visits: 442 },
];

export const fallbackAppointmentSeries = [
  { day: "Mon", bookings: 12 },
  { day: "Tue", bookings: 17 },
  { day: "Wed", bookings: 14 },
  { day: "Thu", bookings: 21 },
  { day: "Fri", bookings: 26 },
  { day: "Sat", bookings: 30 },
  { day: "Sun", bookings: 10 },
];

export const fallbackCustomers = Array.from({ length: 10 }, (_, index) => ({
  id: `cust_${index + 1}`,
  name: ["Rahul Verma", "Priya Shah", "Aditi Jain", "Kabir Singh", "Meera Nair", "Sneha Arora", "Rohan Das", "Pooja Iyer", "Karan Khurana", "Sara Ali"][index],
  phone: `+91 98765 43${(10 + index).toString().padStart(2, "0")}`,
  birthday: `199${index}-0${(index % 9) + 1}-15`,
  gender: index % 2 === 0 ? "Male" : "Female",
  lastVisit: `2026-04-${(10 + index).toString().padStart(2, "0")}`,
  preferredStylist: ["Riya", "Aman", "Zara"][index % 3],
}));

export const fallbackAppointments = [
  { customer: "Rahul Verma", time: "10:30 AM", service: "Haircut + Beard", staff: "Aman", status: "Confirmed" },
  { customer: "Priya Shah", time: "11:15 AM", service: "Hair Spa", staff: "Riya", status: "Checked In" },
  { customer: "Kabir Singh", time: "1:00 PM", service: "Fade + Wash", staff: "Aman", status: "Confirmed" },
  { customer: "Meera Nair", time: "3:30 PM", service: "Bridal Trial", staff: "Zara", status: "Pending" },
];

export const fallbackStaff = [
  { name: "Aman", role: "Senior Stylist", commission: 18, attendance: "96%", sales: 58000 },
  { name: "Riya", role: "Color Specialist", commission: 20, attendance: "92%", sales: 72000 },
  { name: "Zara", role: "Beauty Expert", commission: 16, attendance: "94%", sales: 49000 },
  { name: "Neeraj", role: "Receptionist", commission: 0, attendance: "98%", sales: 0 },
];

export const fallbackReminders = [
  { template: "Appointment Reminder", scheduledFor: "Tomorrow, 5:00 PM", provider: "Twilio", status: "Queued" },
  { template: "Birthday Wish", scheduledFor: "Today, 9:00 AM", provider: "Interakt", status: "Sent" },
  { template: "30 Day Revisit", scheduledFor: "Today, 12:00 PM", provider: "WATI", status: "Failed" },
];

export const fallbackAdminMetrics = {
  totalSalons: 128,
  activeSubscriptions: 91,
  trialUsers: 18,
  overdueSalons: 9,
  mrr: 214782,
  revenueThisMonth: 389450,
  churnedSalons: 6,
  newSignups: 23,
  remindersSent: 8142,
  failedPayments: 7,
};

export const fallbackPayments = [
  { salon: "Glow Studio", amount: 1999, status: "Paid", date: "2026-04-21", method: "Razorpay" },
  { salon: "Urban Trim Lab", amount: 1999, status: "Failed", date: "2026-04-20", method: "Razorpay" },
  { salon: "Velvet Beauty Bar", amount: 3999, status: "Paid", date: "2026-04-18", method: "Razorpay" },
];

export const fallbackSupportTickets = [
  { salon: "Urban Trim Lab", issue: "Failed renewal recovery", priority: "High" },
  { salon: "Glow Studio", issue: "Need WhatsApp template approval help", priority: "Medium" },
  { salon: "Aura Groom House", issue: "Upgrade from Basic to Pro", priority: "Low" },
];
