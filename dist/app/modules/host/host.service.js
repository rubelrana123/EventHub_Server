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
exports.HostService = void 0;
const client_1 = require("@prisma/client");
const paginationHelper_1 = require("../../helper/paginationHelper");
const prisma_1 = require("../../shared/prisma");
// =========================
// GET ALL HOSTS
// =========================
const getAllFromDB = (filters, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm } = filters, filterData = __rest(filters, ["searchTerm"]);
    const andConditions = [];
    // 🔍 SEARCH
    if (searchTerm) {
        andConditions.push({
            OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { email: { contains: searchTerm, mode: "insensitive" } },
                { address: { contains: searchTerm, mode: "insensitive" } },
            ],
        });
    }
    // 🎯 DIRECT FILTERS
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.entries(filterData).map(([key, value]) => ({
                [key]: { equals: value },
            })),
        });
    }
    // Only show active hosts
    andConditions.push({ isDeleted: false });
    const whereConditions = {
        AND: andConditions,
    };
    const result = yield prisma_1.prisma.host.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: "desc" },
        include: {
            // Host created events
            events: {
                include: {
                    reviews: true,
                    participators: true,
                },
            },
            // Linked User
            user: true,
        },
    });
    const total = yield prisma_1.prisma.host.count({
        where: whereConditions,
    });
    return {
        meta: { total, page, limit },
        data: result,
    };
});
// =========================
// GET BY ID
// =========================
const getByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.prisma.host.findUnique({
        where: { id, isDeleted: false },
        include: {
            events: {
                include: {
                    reviews: true,
                    participators: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
            user: true,
        },
    });
    return result;
});
// =========================
// UPDATE HOST PROFILE
// =========================
const updateIntoDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const host = yield prisma_1.prisma.host.findUniqueOrThrow({
        where: { id, isDeleted: false },
    });
    const result = yield prisma_1.prisma.host.update({
        where: { id },
        data: payload,
        include: {
            events: true,
            user: true,
        },
    });
    return result;
});
// =========================
// HARD DELETE HOST
// =========================
const deleteFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const deletedHost = yield tx.host.delete({
            where: { id },
        });
        yield tx.user.delete({
            where: { email: deletedHost.email },
        });
        return deletedHost;
    }));
});
// =========================
// SOFT DELETE HOST
// =========================
const softDelete = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const deletedHost = yield tx.host.update({
            where: { id },
            data: { isDeleted: true },
        });
        yield tx.user.update({
            where: { email: deletedHost.email },
            data: { status: client_1.UserStatus.DELETED },
        });
        return deletedHost;
    }));
});
// =========================
// PUBLIC HOST LIST
// =========================
const getAllPublic = (filters, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm } = filters;
    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { address: { contains: searchTerm, mode: "insensitive" } },
            ],
        });
    }
    andConditions.push({ isDeleted: false });
    const result = yield prisma_1.prisma.host.findMany({
        where: { AND: andConditions },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            profilePhoto: true,
            contactNumber: true,
            address: true,
            createdAt: true,
            updatedAt: true,
            // Event list (public)
            events: {
                select: {
                    id: true,
                    title: true,
                    bannerPhoto: true,
                    dateTime: true,
                    location: true,
                    eventType: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
    const total = yield prisma_1.prisma.host.count({
        where: { AND: andConditions },
    });
    return {
        meta: { total, page, limit },
        data: result,
    };
});
exports.HostService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    deleteFromDB,
    softDelete,
    getAllPublic,
};
