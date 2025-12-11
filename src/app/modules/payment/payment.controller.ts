import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { PaymentService } from "./payment.service";
import sendResponse from "../../shared/sendResponse";
import { stripe } from "../../helper/stripe";
import Stripe from "stripe";
import { prisma } from "../../shared/prisma";
import { PaymentStatus } from "@prisma/client";
 
 
 const handleStripeWebhookEvent= async(req: Request) =>{ 
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
//  console.log("console.log(process.env.STRIPE_WEBHOOK_SECRET): ",process.env.STRIPE_WEBHOOK_SECRET);
    let event: Stripe.Event;
console.log("webhook is working");
  
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        endpointSecret
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      throw new Error("Invalid signature");
    }

 

    if (event.type === "checkout.session.completed") {
       const session = event.data.object as Stripe.Checkout.Session;
      const transactionId = session.payment_intent as string;
      const eventId = session?.metadata?.eventId;
      const paymentId = session?.metadata?.paymentId;
      // console.log({transactionId});

   await prisma.payment.update({
  where:{id:paymentId},
  data:{
  status: session.payment_status === 'paid' ? PaymentStatus.PAID : PaymentStatus.UNPAID,
   method: "STRIPE",
  }
})

      console.log("✅ Payment successful:", transactionId);
    }

    return { received: true };
  }


export const PaymentController = {
    handleStripeWebhookEvent
}