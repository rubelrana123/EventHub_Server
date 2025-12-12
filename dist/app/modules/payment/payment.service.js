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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const prisma_1 = require("../../shared/prisma");
const client_1 = require("@prisma/client");
const paginationHelper_1 = require("../../helper/paginationHelper");
const stripe_1 = require("../../helper/stripe");
const handleStripeWebhookEvent = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const sig = req.headers.get("stripe-signature");
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    console.log("⚡ Webhook received");
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error("❌ Invalid Stripe signature:", err.message);
        throw new Error("Invalid signature");
    }
    // ================================
    // ✔ HANDLE SUCCESSFUL CHECKOUT
    // ================================
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const transactionId = session.payment_intent;
        const eventId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.eventId;
        const paymentId = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.paymentId;
        const eventParticipatorId = (_c = session.metadata) === null || _c === void 0 ? void 0 : _c.eventParticipatorId;
        if (!eventId || !paymentId || !eventParticipatorId) {
            console.error("❌ Missing metadata in Stripe session");
            return { received: true };
        }
        // ================================
        // 1️⃣ Update Payment Status
        // ================================
        yield prisma_1.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: session.payment_status === "paid"
                    ? client_1.PaymentStatus.PAID
                    : client_1.PaymentStatus.UNPAID,
                method: client_1.PaymentMethod.STRIPE, // ✅ Use enum, not string
                // transactionId, if you want to save
            },
        });
        console.log("💰 Payment updated:", paymentId);
        // ================================
        // 2️⃣ Mark EventParticipator as Booked
        // ================================
        yield prisma_1.prisma.eventParticipator.update({
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
        yield prisma_1.prisma.event.update({
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
        const eventData = yield prisma_1.prisma.event.findUnique({
            where: { id: eventId },
            select: { availableSeats: true },
        });
        if (eventData && eventData.availableSeats === 0) {
            yield prisma_1.prisma.event.update({
                where: { id: eventId },
                data: { status: client_1.EventStatus.REGISTRATION_CLOSED },
            });
            console.log("🚪 Event registration closed automatically.");
        }
        console.log("🔥 CHECKOUT SUCCESS LOGIC COMPLETED");
    }
    return { received: true };
});
// ----------------------------------------
// GET MY PAYMENT LIST (Like your Appointments)
// ----------------------------------------
const getMyPayments = (user, filters, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const filterData = __rest(filters, []);
    const andConditions = [];
    // --------------------------------------
    // PARTICIPATOR → Only their own payments
    // --------------------------------------
    if (user.role === client_1.UserRole.PARTICIPATOR) {
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
                equals: filterData[key],
            },
        }));
        andConditions.push(...filterConditions);
    }
    const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    // --------------------------------------
    // Query Payments
    // --------------------------------------
    const result = yield prisma_1.prisma.payment.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
            event: true,
            user: true,
        },
    });
    const total = yield prisma_1.prisma.payment.count({
        where: whereConditions,
    });
    return {
        meta: { total, limit, page },
        data: result,
    };
});
exports.PaymentService = {
    handleStripeWebhookEvent,
    getMyPayments,
};
