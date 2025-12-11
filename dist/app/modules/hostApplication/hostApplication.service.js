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
exports.HostApplicationService = exports.getHostApplicationById = exports.getUserHostApplications = void 0;
const client_1 = require("@prisma/client");
const paginationHelper_1 = require("../../helper/paginationHelper");
const prisma = new client_1.PrismaClient();
/**
 * User (Participator) applies to become a Host
 */
const applyForHost = (user, message) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(user, "user from service", message);
    // // check if already applied
    const isExistinguser = yield prisma.user.findUnique({
        where: { email: user === null || user === void 0 ? void 0 : user.email },
    });
    if (!user) {
        throw new Error("User not found.");
    }
    const isExistApplication = yield prisma.hostApplication.findFirst({
        where: {
            userId: isExistinguser === null || isExistinguser === void 0 ? void 0 : isExistinguser.id,
            status: "PENDING",
        },
    });
    const participator = yield prisma.participator.findUnique({
        where: { email: user === null || user === void 0 ? void 0 : user.email },
    });
    if (!participator) {
        throw new Error("Participator profile not found for this user.");
    }
    if (isExistApplication) {
        throw new Error("You already have a pending host application.");
    }
    // // create new application
    return yield prisma.hostApplication.create({
        data: {
            userId: isExistinguser === null || isExistinguser === void 0 ? void 0 : isExistinguser.id,
            participatorId: participator === null || participator === void 0 ? void 0 : participator.id,
            message,
        },
    });
});
/**
 * ADMIN → Approve Host Application
 */
const processHostApplication = (applicationId, action, adminEmail, adminNote) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const application = yield prisma.hostApplication.findUnique({
        where: { id: applicationId },
        include: { user: true, participator: true },
    });
    if (!application)
        throw new Error("Application not found.");
    if (application.status !== "PENDING")
        throw new Error("Application already processed.");
    // ================================
    // REJECT LOGIC
    // ================================
    if (action === "REJECTED") {
        yield prisma.hostApplication.update({
            where: { id: applicationId },
            data: {
                status: "REJECTED",
                adminEmail,
                adminNote,
            },
        });
        return { message: "Application rejected successfully." };
    }
    // ================================
    // APPROVE LOGIC
    // ================================
    if (action === "APPROVED") {
        // 1) Update application
        yield prisma.hostApplication.update({
            where: { id: applicationId },
            data: {
                status: "APPROVED",
                adminEmail,
                adminNote,
            },
        });
        // 2) Create HOST
        yield prisma.host.create({
            data: {
                email: application.user.email,
                name: application.participator.name,
                profilePhoto: application.participator.profilePhoto,
                contactNumber: (_a = application.participator.contactNumber) !== null && _a !== void 0 ? _a : "",
                address: (_b = application.participator.address) !== null && _b !== void 0 ? _b : "",
            },
        });
        // 3) Update User Role
        yield prisma.user.update({
            where: { id: application.userId },
            data: {
                role: "HOST",
            },
        });
        return { message: "Application approved & user is now a HOST." };
    }
    throw new Error("Invalid action.");
});
/**
 * ADMIN → Get ALL applications
 */
const getAllHostApplications = (filters, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, skip } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const { searchTerm } = filters, filterData = __rest(filters, ["searchTerm"]);
    const andConditions = [];
    // 🔍 SEARCHABLE FIELDS (searchTerm)
    if (searchTerm) {
        andConditions.push({
            OR: [
                // { user: { name: { contains: searchTerm, mode: "insensitive" } } },
                { user: { email: { contains: searchTerm, mode: "insensitive" } } },
            ],
        });
    }
    // 🎯 DIRECT FILTER FIELDS (status, userId, adminId, etc.)
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
            })),
        });
    }
    // ❗ Only fetch non-deleted applications (if you have soft delete)
    andConditions.push({ isDeleted: false });
    const whereConditions = {
        AND: andConditions,
    };
    // 📌 QUERY HOST APPLICATIONS
    const result = yield prisma.hostApplication.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: "desc" },
        include: {
            user: true,
            admin: true,
            participator: true,
        },
    });
    // 📌 TOTAL COUNT
    const total = yield prisma.hostApplication.count({
        where: whereConditions,
    });
    return {
        meta: { total, page, limit },
        data: result,
    };
});
/**
 * USER → Get their own application history
 */
const getUserHostApplications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.hostApplication.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
});
exports.getUserHostApplications = getUserHostApplications;
/**
 * ADMIN → Get single host application
 */
const getHostApplicationById = (applicationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.hostApplication.findUnique({
        where: { id: applicationId },
        include: {
            user: true,
            participator: true,
            admin: true,
        },
    });
});
exports.getHostApplicationById = getHostApplicationById;
const deleteHostApplication = (applicationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.hostApplication.update({
        where: { id: applicationId },
        data: { isDeleted: true },
    });
});
exports.HostApplicationService = {
    applyForHost,
    processHostApplication,
    getUserHostApplications: exports.getUserHostApplications,
    getHostApplicationById: exports.getHostApplicationById,
    getAllHostApplications,
    deleteHostApplication
};
