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
const participator_constant_1 = require("./participator.constant");
const paginationHelper_1 = require("../../helper/paginationHelper");
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
exports.ParticipatorService = {
    getAllParticipator,
    updateIntoDB,
    deleteParticipatorFromDB,
    getByIdFromDB,
};
