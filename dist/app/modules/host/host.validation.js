"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostValidation = void 0;
const zod_1 = require("zod");
const create = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({ error: "Email is required" })
            .email("Invalid email format"),
        name: zod_1.z.string({ error: "Name is required" }),
        profilePhoto: zod_1.z.string({ error: "Profile photo is required" }),
        contactNumber: zod_1.z.string({ error: "Contact number is required" }),
        address: zod_1.z.string({ error: "Address is required" }),
        bio: zod_1.z.string({ error: "Bio is required" }),
        experience: zod_1.z
            .number({ error: "Experience is required" })
            .min(0, "Experience cannot be negative"),
        gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"], { error: "Gender is required" }),
        nationalId: zod_1.z.string({ error: "National ID is required" }),
        supportingDocuments: zod_1.z.array(zod_1.z.string()).default([]), // optional but accepted
        registrationStatus: zod_1.z
            .enum(["PENDING", "APPROVED", "REJECTED"])
            .default("PENDING"),
    }),
});
const update = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        profilePhoto: zod_1.z.string().optional(),
        contactNumber: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        bio: zod_1.z.string().optional(),
        experience: zod_1.z.number().min(0).optional(),
        gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
        nationalId: zod_1.z.string().optional(),
        supportingDocuments: zod_1.z.array(zod_1.z.string()).optional(),
        registrationStatus: zod_1.z
            .enum(["PENDING", "APPROVED", "REJECTED"])
            .optional(),
    }),
});
exports.HostValidation = {
    create,
    update,
};
