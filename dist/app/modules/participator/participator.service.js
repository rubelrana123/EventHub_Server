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
exports.ParticipatorService = void 0;
const client_1 = require("@prisma/client");
const participator_constant_1 = require("./participator.constant");
const paginationHelper_1 = require("../../helper/paginationHelper");
const stripe_1 = require("../../helper/stripe");
const uuid_1 = require("uuid");
const prisma_1 = require("../../shared/prisma");
const getAllParticipator = (filters, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm } = filters, filterData = __rest(filters, ["searchTerm"]);
    const andConditions = [];
    // 🔍 Search
    if (searchTerm) {
        andConditions.push({
            OR: participator_constant_1.participatorSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }
    // 🎯 Filters
    if (Object.keys(filterData).length > 0) {
        const filterConditions = Object.keys(filterData).map((key) => ({
            [key]: {
                equals: filterData[key],
            },
        }));
        andConditions.push(...filterConditions);
    }
    const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    // 📌 Query
    const result = yield prisma_1.prisma.participator.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: {
            [sortBy || "createdAt"]: sortOrder || "desc",
        },
        include: {
            reviews: true,
            eventParticipations: {
                include: {
                    event: true, // ⭐ All joined event history
                },
            },
        },
    });
    const total = yield prisma_1.prisma.participator.count({
        where: whereConditions,
    });
    return {
        meta: { page, limit, total },
        data: result,
    };
});
/**

* Delete Participator
  */
const deleteParticipatorFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prisma.participator.delete({
        where: { id },
    });
});
/**

* Update Participator Profile
  */
const updateIntoDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const allowedFields = ["name", "profilePhoto", "address", "interests", "bio"];
    const participatorData = {};
    for (const key of allowedFields) {
        if (payload[key] !== undefined) {
            participatorData[key] = payload[key];
        }
    }
    const participatorInfo = yield prisma_1.prisma.participator.findUniqueOrThrow({
        where: {
            email: user.email,
            isDeleted: false,
        },
    });
    return yield prisma_1.prisma.$transaction((tnx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tnx.participator.update({
            where: { id: participatorInfo.id },
            data: participatorData,
        });
        return tnx.participator.findUnique({
            where: { id: participatorInfo.id },
            include: {
                reviews: true,
                eventParticipations: {
                    include: {
                        event: true,
                    },
                },
            },
        });
    }));
});
const getByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.prisma.participator.findUnique({
        where: {
            id,
            isDeleted: false,
        },
        include: {
            reviews: true,
            eventParticipations: {
                include: {
                    event: true,
                },
            },
        },
    });
    return result;
});
// ...existing code...
const createParticipation = (eventId, user) => __awaiter(void 0, void 0, void 0, function* () {
    const userEmail = user === null || user === void 0 ? void 0 : user.email;
    console.log("hit create partition");
    // 1️⃣ Find user and participator
    const dbUser = yield prisma_1.prisma.user.findFirst({
        where: { email: userEmail, status: client_1.UserStatus.ACTIVE },
        include: { participator: true },
    });
    if (!dbUser || !dbUser.participator)
        throw new Error("User not found or cannot participate");
    const userId = dbUser.id;
    const participatorId = dbUser.participator.id;
    // 2️⃣ Find event
    const event = yield prisma_1.prisma.event.findFirst({ where: { id: eventId, isDeleted: false } });
    if (!event)
        throw new Error("Event not found");
    if ([client_1.EventStatus.LIVE, client_1.EventStatus.COMPLETED, client_1.EventStatus.REGISTRATION_CLOSED].includes(event.status))
        throw new Error("Cannot join this event now");
    if (event.availableSeats !== null && event.availableSeats <= 0)
        throw new Error("No seats available");
    // 3️⃣ Check duplicate participation
    const alreadyJoined = yield prisma_1.prisma.eventParticipator.findFirst({ where: { eventId, userId } });
    if (alreadyJoined)
        throw new Error("Already joined this event");
    // 4️⃣ Create participation and payment
    return yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Participation (seat reserved, not yet booked)
        const participation = yield tx.eventParticipator.create({
            data: { eventId, userId, participatorId },
        });
        console.log("create partition");
        // Payment record (UNPAID)
        const payment = yield tx.payment.create({
            data: {
                eventParticipationId: participation.id,
                eventId,
                userId,
                amount: event.joiningFee,
                status: client_1.PaymentStatus.UNPAID,
                method: client_1.PaymentMethod.STRIPE,
                transactionId: (0, uuid_1.v4)(),
            },
        });
        console.log("create paynent");
        // 5️⃣ Create Stripe session
        const session = yield stripe_1.stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: userEmail,
            line_items: [
                {
                    price_data: {
                        currency: "bdt",
                        product_data: { name: `Event: ${event.title}` },
                        unit_amount: event.joiningFee * 100,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                eventId: event.id,
                paymentId: payment.id,
                eventParticipatorId: participation.id,
            },
            success_url: `https://web.programming-hero.com/home/payment-success?eventId=${event.id}`,
            cancel_url: `https://next.programming-hero.com/payment-cancel?eventId=${event.id}`,
        });
        console.log("create session payment", session);
        return {
            paymentUrl: session.url,
            participationId: participation.id,
            paymentId: payment.id,
        };
    }));
});
// ...existing code...
exports.ParticipatorService = {
    getAllParticipator,
    updateIntoDB,
    deleteParticipatorFromDB,
    getByIdFromDB,
    createParticipation,
};
