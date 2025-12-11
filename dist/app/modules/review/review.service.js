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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = require("../../shared/prisma");
const ApiError_1 = __importDefault(require("../../helper/ApiError"));
const paginationHelper_1 = require("../../helper/paginationHelper");
const insertIntoDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Verify participator exists
    const participator = yield prisma_1.prisma.participator.findUniqueOrThrow({
        where: { email: user.email },
    });
    // 2. Validate event participator record (payload.eventId is eventParticipatorId)
    const eventParticipator = yield prisma_1.prisma.eventParticipator.findUniqueOrThrow({
        where: { id: payload.eventId },
    });
    // 3. Ensure user is reviewing their own participation
    if (eventParticipator.participatorId !== participator.id) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "You are not allowed to review this event!");
    }
    // 4. Fetch full event data to locate event + host
    const event = yield prisma_1.prisma.event.findUniqueOrThrow({
        where: { id: eventParticipator.eventId },
        select: { id: true, hostId: true },
    });
    if (!event.hostId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "This event does not have a host assigned.");
    }
    // 5. Insert review + update host rating inside a transaction
    return prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const review = yield tx.review.create({
            data: {
                rating: payload.rating,
                comment: payload.comment,
                eventId: event.id,
                participatorId: participator.id,
                userId: (_a = user.id) !== null && _a !== void 0 ? _a : null, // optional
            },
        });
        // 6. Recalculate host average rating
        const hostEvents = yield tx.event.findMany({
            where: { hostId: event.hostId },
            select: { id: true },
        });
        const hostEventIds = hostEvents.map((ev) => ev.id);
        const aggregated = yield tx.review.aggregate({
            where: { eventId: { in: hostEventIds } },
            _avg: { rating: true },
        });
        yield tx.host.update({
            where: { id: event.hostId },
            data: {
                // fallback to 0 if no reviews yet
                averageRating: (_b = aggregated._avg.rating) !== null && _b !== void 0 ? _b : 0,
            },
        });
        return review;
    }));
});
const getAllFromDB = (filters, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { participatorEmail, eventId, userEmail } = filters;
    const andConditions = [];
    if (participatorEmail) {
        andConditions.push({
            participator: { email: participatorEmail },
        });
    }
    if (eventId) {
        andConditions.push({
            eventId,
        });
    }
    if (userEmail) {
        andConditions.push({
            user: { email: userEmail },
        });
    }
    const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    const result = yield prisma_1.prisma.review.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: "desc" },
        include: {
            event: true,
            participator: true,
            user: true,
        },
    });
    const total = yield prisma_1.prisma.review.count({
        where: whereConditions,
    });
    return {
        meta: { total, page, limit },
        data: result,
    };
});
exports.ReviewService = {
    insertIntoDB,
    getAllFromDB,
};
