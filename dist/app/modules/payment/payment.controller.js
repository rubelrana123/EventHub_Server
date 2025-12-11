"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const prisma_1 = require("../../shared/prisma");
const client_1 = require("@prisma/client");
const stripe_1 = require("../../helper/stripe");
const handleStripeWebhookEvent = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log("hit strpe hook");
    const sig = req.headers["stripe-signature"];
    console.log("hit strpe hook headers", req.headers);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error("❌ Invalid Stripe signature:", err.message);
        throw new Error("Invalid signature");
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const eventId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.eventId;
        const paymentId = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.paymentId;
        const eventParticipatorId = (_c = session.metadata) === null || _c === void 0 ? void 0 : _c.eventParticipatorId;
        if (!eventId || !paymentId || !eventParticipatorId) {
            console.error("❌ Missing metadata in Stripe session");
            return { received: true };
        }
        try {
            yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                // 1️⃣ Update payment status
                yield tx.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: client_1.PaymentStatus.PAID,
                        method: client_1.PaymentMethod.STRIPE,
                        transactionId: session.payment_intent,
                    },
                });
                // 2️⃣ Mark participation as booked
                yield tx.eventParticipator.update({
                    where: { id: eventParticipatorId },
                    data: { isBooked: true, paymentId },
                });
                // 3️⃣ Decrement available seats
                yield tx.event.update({
                    where: { id: eventId },
                    data: { availableSeats: { decrement: 1 } },
                });
                // 4️⃣ Auto-close registration if no seats left
                const eventData = yield tx.event.findUnique({
                    where: { id: eventId },
                    select: { availableSeats: true },
                });
                if ((eventData === null || eventData === void 0 ? void 0 : eventData.availableSeats) === 0) {
                    yield tx.event.update({
                        where: { id: eventId },
                        data: { status: client_1.EventStatus.REGISTRATION_CLOSED },
                    });
                    console.log("🚪 Event registration closed automatically.");
                }
            }));
            console.log("🔥 Payment and participation updated successfully:", paymentId);
        }
        catch (err) {
            console.error("❌ Failed to process Stripe checkout session:", err);
            throw err;
        }
    }
    return { received: true };
});
exports.PaymentController = {
    handleStripeWebhookEvent
};
