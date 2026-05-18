import { Resend } from "resend";
import { getSessionContext } from "@/lib/auth";
import { getCampaignEmailsSentThisMonthForSalon, logCampaignEmail } from "@/lib/db/email-campaigns";
import { getReadOnlyReason } from "@/lib/gating";
import { PLAN_DEFINITIONS } from "@/lib/plans";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const session = await getSessionContext();

    if (!session.salonId) {
      return Response.json({ error: "No salon is attached to this account." }, { status: 403 });
    }

    if (session.readOnlyMode) {
      return Response.json(
        { error: getReadOnlyReason(session.subscriptionStatus) ?? "Email sending is blocked in read-only mode." },
        { status: 403 },
      );
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return Response.json(
        { error: "Email service is not configured. Set RESEND_API_KEY and EMAIL_FROM." },
        { status: 500 },
      );
    }

    const body = await req.json();

    if (!body?.email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const emailLimit = PLAN_DEFINITIONS[session.planId].emailLimit;
    const emailsSentThisMonth = await getCampaignEmailsSentThisMonthForSalon(session.salonId);

    if (emailLimit !== null && emailsSentThisMonth >= emailLimit) {
      return Response.json(
        { error: `Monthly email limit reached. Your ${PLAN_DEFINITIONS[session.planId].name} plan includes ${emailLimit} emails per month.` },
        { status: 403 },
      );
    }

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: body.email,
      subject: "Salon Appointment Confirmed",
      html: `
        <h2>Appointment Confirmed</h2>
        <p>Hello ${body.name ?? "there"},</p>
        <p>Your appointment is booked for ${body.date ?? "the selected time"}.</p>
      `,
    });

    await logCampaignEmail({
      salonId: session.salonId,
      email: body.email,
      title: "Salon Appointment Confirmed",
      audience: "direct",
      status: "sent",
    });

    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    );
  }
}
