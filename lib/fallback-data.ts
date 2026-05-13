import type { PlanId, SessionContext, SubscriptionStatus } from "@/lib/types";

export const fallbackSession: Record<"salonOwner", SessionContext> = {
  salonOwner: {
    user: { id: "00000000-0000-0000-0000-000000000002", email: "owner@glowstudio.in", name: "Ananya Kapoor" },
    role: "SALON_OWNER",
    salonId: "11111111-1111-1111-1111-111111111111",
    salonName: "Glow Studio",
    email: "owner@glowstudio.in",
    subscriptionStatus: "active",
    planId: "pro",
    readOnlyMode: false,
  },
};

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

export const fallbackPayments = [
  { salon: "Glow Studio", amount: 1999, status: "Paid", date: "2026-04-21", method: "Razorpay" },
];
