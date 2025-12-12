import { Request } from "express";
import Stripe from "stripe";
 
import { PaymentStatus, PaymentMethod, EventStatus } from "@prisma/client";
import { stripe } from "../../helper/stripe";
import { prisma } from "../../shared/prisma";
  const handleStripeWebhookEvent = async (req: Request) => {
    console.log("hit strpe hook")
  const sig = req.headers["stripe-signature"] as string;
    console.log("hit strpe hook headers", req.headers)

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("❌ Invalid Stripe signature:", err.message);
    throw new Error("Invalid signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const eventId = session.metadata?.eventId;
    const paymentId = session.metadata?.paymentId;
    const eventParticipatorId = session.metadata?.eventParticipatorId;

    if (!eventId || !paymentId || !eventParticipatorId) {
      console.error("❌ Missing metadata in Stripe session");
      return { received: true };
    }

    try {
      await prisma.$transaction(async (tx) => {
        // 1️⃣ Update payment status
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.PAID,
            method: PaymentMethod.STRIPE,
            transactionId: session.payment_intent as string,
          },
        });

        // 2️⃣ Mark participation as booked
        await tx.eventParticipator.update({
          where: { id: eventParticipatorId },
          data: { isBooked: true, paymentId },
        });

        // 3️⃣ Decrement available seats
        await tx.event.update({
          where: { id: eventId },
          data: { availableSeats: { decrement: 1 } },
        });

        // 4️⃣ Auto-close registration if no seats left
        const eventData = await tx.event.findUnique({
          where: { id: eventId },
          select: { availableSeats: true },
        });

        if (eventData?.availableSeats === 0) {
          await tx.event.update({
            where: { id: eventId },
            data: { status: EventStatus.REGISTRATION_CLOSED },
          });
          console.log("🚪 Event registration closed automatically.");
        }
      });

      console.log("🔥 Payment and participation updated successfully:", paymentId);
    } catch (err) {
      console.error("❌ Failed to process Stripe checkout session:", err);
      throw err;
    }
  }

  return { received: true };
};
export const PaymentController  = {
  handleStripeWebhookEvent
};