"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventValidation = void 0;
const zod_1 = require("zod");
const create = zod_1.z.object({
    title: zod_1.z.string({ error: "Title is required" }),
    description: zod_1.z.string({ error: "Description is required" }),
    dateTime: zod_1.z.string({ error: "Date & time is required" }),
    location: zod_1.z.string({ error: "Location is required" }),
    minParticipants: zod_1.z
        .number({ error: "Minimum participants is required" })
        .min(0, "Minimum participants cannot be negative")
        .optional(),
    maxParticipants: zod_1.z
        .number({ error: "Maximum participants is required" })
        .min(1, "Maximum participants must be at least 1"),
    joiningFee: zod_1.z
        .number({ error: "Joining fee is required" })
        .min(0, "Joining fee cannot be negative"),
    eventType: zod_1.z.string({ error: "Event type is required" }),
    // bannerPhoto must NOT be required here
    bannerPhoto: zod_1.z.string().optional(),
});
const update = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        bannerPhoto: zod_1.z.string().optional(),
        dateTime: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        minParticipants: zod_1.z.number().min(0).optional(),
        maxParticipants: zod_1.z.number().min(1).optional(),
        joiningFee: zod_1.z.number().min(0).optional(),
        eventType: zod_1.z.string().optional(),
    }),
});
exports.EventValidation = {
    create,
    update,
};
