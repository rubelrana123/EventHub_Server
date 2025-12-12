"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = __importDefault(require("zod"));
// ==============================
// PARTICIPATOR VALIDATION
// ==============================
const createParticipatorValidationSchema = zod_1.default.object({
    password: zod_1.default.string().min(6, "Password is required"),
    participator: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required"),
        email: zod_1.default.string().email("Valid email required"),
        profilePhoto: zod_1.default.string().optional(),
        contactNumber: zod_1.default.string().min(11, "Contact number is required").optional(),
        address: zod_1.default.string().optional(),
        interests: zod_1.default.string().optional(),
        bio: zod_1.default.string().optional(),
    }),
});
// ==============================
// HOST VALIDATION
// ==============================
const createHostValidationSchema = zod_1.default.object({
    password: zod_1.default.string().min(6, "Password is required"),
    host: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required"),
        email: zod_1.default.string().email("Valid email required"),
        profilePhoto: zod_1.default.string().optional(),
        contactNumber: zod_1.default.string().min(1, "Contact number is required"),
        address: zod_1.default.string().min(1, "Address is required"),
    }),
});
// ==============================
// ADMIN VALIDATION
// ==============================
const createAdminValidationSchema = zod_1.default.object({
    password: zod_1.default.string().min(6, "Password is required"),
    admin: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name is required"),
        email: zod_1.default.string().email("Valid email required"),
        profilePhoto: zod_1.default.string().optional(),
        contactNumber: zod_1.default.string().min(1, "Contact number is required"),
    }),
});
// ==============================
// GENERIC USER (IF NEEDED)
// ==============================
const createUserValidationSchema = zod_1.default.object({
    email: zod_1.default.string().email("Valid email is required"),
    password: zod_1.default.string().min(6, "Password must be at least 6 characters"),
    role: zod_1.default.enum(["ADMIN", "HOST", "PARTICIPATOR"]).optional(),
});
exports.UserValidation = {
    createParticipatorValidationSchema,
    createHostValidationSchema,
    createAdminValidationSchema,
    createUserValidationSchema,
};
