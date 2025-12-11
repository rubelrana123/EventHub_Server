import { Request } from "express";
import Stripe from "stripe";
import { prisma } from "../../shared/prisma";
import { PaymentStatus, PaymentMethod, EventStatus } from "@prisma/client";
import { stripe } from "../../helper/stripe";

export const handleStripeWebhookEvent = async (req: Request) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  console.log("⚡ Webhook received");

  // -------------------------
  // 1️⃣ Verify Stripe signature
  // -------------------------
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("❌ Invalid Stripe signature:", err.message);
    throw new Error("Invalid signature");
  }

  // -------------------------
  // 2️⃣ Handle successful checkout
  // -------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const eventId = session.metadata?.eventId;
    const paymentId = session.metadata?.paymentId;
    const eventParticipatorId = session.metadata?.eventParticipatorId;
    const transactionId = session.payment_intent as string;

    if (!eventId || !paymentId || !eventParticipatorId) {
      console.error("❌ Missing metadata in Stripe session");
      return { received: true };
    }

    try {
      // -------------------------
      // 3️⃣ Use transaction for safety
      // -------------------------
      await prisma.$transaction(async (tx) => {
        // A. Update Payment
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
            method: PaymentMethod.STRIPE,
            // Optional: store Stripe transaction ID
            // transactionId,
          },
        });

        // B. Mark participation as booked
        await tx.eventParticipator.update({
          where: { id: eventParticipatorId },
          data: {
            isBooked: true,
            paymentId,
          },
        });

        // C. Decrement available seats
        await tx.event.update({
          where: { id: eventId },
          data: {
            availableSeats: {
              decrement: 1,
            },
          },
        });

        // D. Auto-close registration if no seats left
        const eventData = await tx.event.findUnique({
          where: { id: eventId },
          select: { availableSeats: true },
        });

        if (eventData && eventData.availableSeats === 0) {
          await tx.event.update({
            where: { id: eventId },
            data: { status: EventStatus.REGISTRATION_CLOSED },
          });
          console.log("🚪 Event registration closed automatically.");
        }
      });

      console.log("🔥 Checkout session processed successfully:", paymentId);
    } catch (err) {
      console.error("❌ Failed to process Stripe checkout session:", err);
      throw err;
    }
  }

  return { received: true };
};


export   const PaymentController = {
  handleStripeWebhookEvent,
};