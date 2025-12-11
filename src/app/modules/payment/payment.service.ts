import Stripe from "stripe";
import { prisma } from "../../shared/prisma";
import { EventStatus, PaymentMethod, PaymentStatus, Prisma, UserRole } from "@prisma/client";
import { IJWTPayload } from "../../types";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { stripe } from "../../helper/stripe";


const handleStripeWebhookEvent = async (req: Request) => {
  const sig = req.headers.get("stripe-signature");
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  console.log("⚡ Webhook received");

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).body,
      sig as string,
      endpointSecret
    );
  } catch (err: any) {
    console.error("❌ Invalid Stripe signature:", err.message);
    throw new Error("Invalid signature");
  }

  // ================================
  // ✔ HANDLE SUCCESSFUL CHECKOUT
  // ================================
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const transactionId = session.payment_intent as string;

    const eventId = session.metadata?.eventId;
    const paymentId = session.metadata?.paymentId;
    const eventParticipatorId = session.metadata?.eventParticipatorId;

    if (!eventId || !paymentId || !eventParticipatorId) {
      console.error("❌ Missing metadata in Stripe session");
      return { received: true };
    }

    // ================================
    // 1️⃣ Update Payment Status
    // ================================
await prisma.payment.update({
  where: { id: paymentId },
  data: {
    status:
      session.payment_status === "paid"
        ? PaymentStatus.PAID
        : PaymentStatus.UNPAID,
    method: PaymentMethod.STRIPE, // ✅ Use enum, not string
    // transactionId, if you want to save
  },
});

    console.log("💰 Payment updated:", paymentId);

    // ================================
    // 2️⃣ Mark EventParticipator as Booked
    // ================================
    await prisma.eventParticipator.update({
      where: { id: eventParticipatorId },
      data: {
        isBooked: true,
        paymentId: paymentId,
      },
    });

    console.log("🎟️ Participation marked as booked:", eventParticipatorId);

    // ================================
    // 3️⃣ Decrease Available Seats
    // ================================
    await prisma.event.update({
      where: { id: eventId },
      data: {
        availableSeats: {
          decrement: 1,
        },
      },
    });

    console.log("📉 Seat reduced for event:", eventId);

    // ================================
    // 4️⃣ Optional: Auto Close Registration
    // ================================
    const eventData = await prisma.event.findUnique({
      where: { id: eventId },
      select: { availableSeats: true },
    });

    if (eventData && eventData.availableSeats === 0) {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: EventStatus.REGISTRATION_CLOSED },
      });
      console.log("🚪 Event registration closed automatically.");
    }

    console.log("🔥 CHECKOUT SUCCESS LOGIC COMPLETED");
  }

  return { received: true };
};

// ----------------------------------------
// GET MY PAYMENT LIST (Like your Appointments)
// ----------------------------------------
const getMyPayments = async (
  user: IJWTPayload,
  filters: any,
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { ...filterData } = filters;

  const andConditions: Prisma.PaymentWhereInput[] = [];

  // --------------------------------------
  // PARTICIPATOR → Only their own payments
  // --------------------------------------
  if (user.role === UserRole.PARTICIPATOR) {
    andConditions.push({
      user: { email: user.email },
    });
  }

  // Host & Admin can see everything — no need to filter by default


  // --------------------------------------
  // Apply Filters
  // --------------------------------------
  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.PaymentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // --------------------------------------
  // Query Payments
  // --------------------------------------
  const result = await prisma.payment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      event: true,
      user: true,
    },
  });

  const total = await prisma.payment.count({
    where: whereConditions,
  });

  return {
    meta: { total, limit, page },
    data: result,
  };
};



export const PaymentService = {
  handleStripeWebhookEvent,
  getMyPayments,
};
