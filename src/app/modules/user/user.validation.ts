import z from "zod";

// ==============================
// PARTICIPATOR VALIDATION
// ==============================
const createParticipatorValidationSchema = z.object({
  password: z.string().min(6, "Password is required"),
  participator: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    profilePhoto: z.string().optional(),
    address: z.string().optional(),
    interests: z.string().optional(),
    bio: z.string().optional(),
  }),
});

// ==============================
// HOST VALIDATION
// ==============================
const createHostValidationSchema = z.object({
  password: z.string().min(6, "Password is required"),
  host: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    profilePhoto: z.string().optional(),
    contactNumber: z.string().min(1, "Contact number is required"),
    address: z.string().min(1, "Address is required"),
  }),
});

// ==============================
// ADMIN VALIDATION
// ==============================
const createAdminValidationSchema = z.object({
  password: z.string().min(6, "Password is required"),
  admin: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    profilePhoto: z.string().optional(),
    contactNumber: z.string().min(1, "Contact number is required"),
  }),
});

// ==============================
// GENERIC USER (IF NEEDED)
// ==============================
const createUserValidationSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "HOST", "PARTICIPATOR"]).optional(),
});

export const UserValidation = {
  createParticipatorValidationSchema,
  createHostValidationSchema,
  createAdminValidationSchema,
  createUserValidationSchema,
};
