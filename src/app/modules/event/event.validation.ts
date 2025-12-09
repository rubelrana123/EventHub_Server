import { z } from "zod";

const create = z.object({
  title: z.string({ error: "Title is required" }),
  description: z.string({ error: "Description is required" }),
  dateTime: z.string({ error: "Date & time is required" }),
  location: z.string({ error: "Location is required" }),

  minParticipants: z
    .number({ error: "Minimum participants is required" })
    .min(0, "Minimum participants cannot be negative")
    .optional(),

  maxParticipants: z
    .number({ error: "Maximum participants is required" })
    .min(1, "Maximum participants must be at least 1"),

  joiningFee: z
    .number({ error: "Joining fee is required" })
    .min(0, "Joining fee cannot be negative"),

  eventType: z.string({ error: "Event type is required" }),

  // bannerPhoto must NOT be required here
  bannerPhoto: z.string().optional(),
});

const update = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    bannerPhoto: z.string().optional(),
    dateTime: z.string().optional(),
    location: z.string().optional(),

    minParticipants: z.number().min(0).optional(),
    maxParticipants: z.number().min(1).optional(),
    joiningFee: z.number().min(0).optional(),

    eventType: z.string().optional(),
  }),
});

export const EventValidation = {
  create,
  update,
};
