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
exports.EventService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../shared/prisma");
const fileUploader_1 = require("../../helper/fileUploader");
const paginationHelper_1 = require("../../helper/paginationHelper");
const event_constant_1 = require("./event.constant");
// ============================
// CREATE EVENT
// ============================
const createEvent = (req) => __awaiter(void 0, void 0, void 0, function* () {
    // ============================
    // FILE UPLOAD (like demo)
    // ============================
    if (req.file) {
        const uploaded = yield fileUploader_1.fileUploader.uploadToCloudinary(req.file);
        req.body.bannerPhoto = uploaded === null || uploaded === void 0 ? void 0 : uploaded.secure_url;
    }
    const userEmail = req.user.email;
    // ============================
    // START TRANSACTION (same as demo)
    // ============================
    const event = yield prisma_1.prisma.$transaction((tnx) => __awaiter(void 0, void 0, void 0, function* () {
        // -------------------------------------
        // 1. Validate Active User
        // -------------------------------------
        yield tnx.user.findUniqueOrThrow({
            where: {
                email: userEmail,
                status: client_1.UserStatus.ACTIVE,
            },
        });
        // -------------------------------------
        // 2. User must be a Host
        // -------------------------------------
        const hostProfile = yield tnx.host.findUnique({
            where: { email: userEmail },
        });
        if (!hostProfile) {
            throw new Error("You must be a Host to create an event");
        }
        // -------------------------------------
        // 3. Create Event (same pattern as demo)
        // -------------------------------------
        return yield tnx.event.create({
            data: {
                title: req.body.title,
                description: req.body.description,
                bannerPhoto: req.body.bannerPhoto || null,
                dateTime: req.body.dateTime,
                location: req.body.location,
                minParticipants: req.body.minParticipants,
                maxParticipants: req.body.maxParticipants,
                availableSeats: req.body.maxParticipants,
                joiningFee: req.body.joiningFee,
                eventType: req.body.eventType,
                hostId: hostProfile.id,
                createdByEmail: userEmail,
            },
            include: {
                host: true,
            },
        });
    }));
    return event;
});
// ============================
// GET ALL EVENTS
// ============================
const getAllEvents = (params, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm } = params, filterData = __rest(params, ["searchTerm"]);
    const andConditions = [];
    // ==============================
    // 1. Search (title, location, eventType)
    // ==============================
    if (searchTerm) {
        andConditions.push({
            OR: event_constant_1.eventSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }
    // ==============================
    // 2. Filtering (category, location, etc.)
    // ==============================
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: filterData[key],
                },
            })),
        });
    }
    // ==============================
    // Always exclude deleted events
    // ==============================
    andConditions.push({
        isDeleted: false,
    });
    const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    // ==============================
    // 3. Fetch events
    // ==============================
    const events = yield prisma_1.prisma.event.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            host: true,
            participators: true,
            reviews: true,
        },
    });
    // ==============================
    // 4. Count for pagination
    // ==============================
    const total = yield prisma_1.prisma.event.count({
        where: whereConditions,
    });
    return {
        meta: {
            page,
            limit,
            total,
        },
        data: events,
    };
});
// ============================
// GET EVENT BY ID
// ============================
const getEventById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prisma.event.findUniqueOrThrow({
        where: { id },
        include: {
            host: true,
            participators: {
                include: { user: true },
            },
            reviews: true,
        },
    });
});
// ============================
// UPDATE EVENT
// ============================
const updateEvent = (eventId, user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = user;
    const host = yield prisma_1.prisma.host.findUnique({
        where: { email },
    });
    if (!host)
        throw new Error("Only Hosts can update their events");
    // ensure the event belongs to this host
    const event = yield prisma_1.prisma.event.findUniqueOrThrow({
        where: { id: eventId },
    });
    if (event.hostId !== host.id) {
        throw new Error("You are not allowed to update this event");
    }
    const updatedEvent = yield prisma_1.prisma.event.update({
        where: { id: eventId },
        data: payload,
    });
    return updatedEvent;
});
// ============================
// DELETE EVENT (SOFT DELETE)
// ============================
const deleteEvent = (eventId, user) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = user;
    const host = yield prisma_1.prisma.host.findUnique({
        where: { email },
    });
    if (!host)
        throw new Error("Only Hosts can delete their events");
    // ensure ownership
    const event = yield prisma_1.prisma.event.findUniqueOrThrow({
        where: { id: eventId },
    });
    if (event.hostId !== host.id) {
        throw new Error("You are not allowed to delete this event");
    }
    return yield prisma_1.prisma.event.update({
        where: { id: eventId },
        data: { isDeleted: true },
    });
});
// ============================
// USER JOINS EVENT
// ============================
const joinEvent = (eventId, user) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = user.id;
    const event = yield prisma_1.prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        include: {
            participators: true,
        },
    });
    // Check max participants
    if (event.maxParticipants &&
        event.participators.length >= event.maxParticipants) {
        throw new Error("Event seats are full");
    }
    const participator = yield prisma_1.prisma.participator.findUnique({
        where: { email: user.email },
    });
    if (!participator) {
        throw new Error("You must have a Participator profile to join an event");
    }
    const result = yield prisma_1.prisma.eventParticipator.create({
        data: {
            eventId,
            userId,
            participatorId: participator.id,
        },
    });
    return result;
});
// ============================
// EXPORT
// ============================
exports.EventService = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    joinEvent,
};
