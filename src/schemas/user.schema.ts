// src/schemas/user.schema.ts
import { z } from "zod";

// ✅ Signup schema
export const registerUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters long"),
        email: z.string().refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
            message: "Invalid email address",
        }),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(32, "Password cannot exceed 32 characters")
            .refine((value) => /[A-Z]/.test(value), {
                message: "Password must contain at least one uppercase letter",
            })
            .refine((value) => /[a-z]/.test(value), {
                message: "Password must contain at least one lowercase letter",
            })
            .refine((value) => /[0-9]/.test(value), {
                message: "Password must contain at least one number",
            })
            .refine((value) => /[!@#$%^&*(),.?":{}|<>]/.test(value), {
                message: "Password must contain at least one special character",
            }),
    }),
});

// ✅ Login schema
export const loginUserSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
    }),
});

// ✅ Verify email schema
export const verifyEmailSchema = z.object({
    body: z.object({
        email: z.string().refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
            message: "Invalid email address",
        }),
    }),
});

// ✅ Verify verification code schema
export const verifyVerificationSchema = z.object({
    body: z.object({
        email: z.string().refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
            message: "Invalid email address",
        }),
        providedCode: z
            .number()
            .int("Verification code must be an integer")
            .min(100000, "Verification code must be a 6-digit number")
            .max(999999, "Verification code must be a 6-digit number"),
    }),
});

// ✅ Change password schema
export const changePasswordSchema = z.object({
    body: z.object({
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(32, "Password cannot exceed 32 characters")
            .refine((value) => /[A-Z]/.test(value), {
                message: "Password must contain at least one uppercase letter",
            })
            .refine((value) => /[a-z]/.test(value), {
                message: "Password must contain at least one lowercase letter",
            })
            .refine((value) => /[0-9]/.test(value), {
                message: "Password must contain at least one number",
            })
            .refine((value) => /[!@#$%^&*(),.?":{}|<>]/.test(value), {
                message: "Password must contain at least one special character",
            }),
    }),
});

// ✅ Forgot password schema
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
            message: "Invalid email address",
        }),
        providedCode: z
            .number()
            .int("Verification code must be an integer")
            .min(100000, "Verification code must be a 6-digit number")
            .max(999999, "Verification code must be a 6-digit number"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(32, "Password cannot exceed 32 characters")
            .refine((value) => /[A-Z]/.test(value), {
                message: "Password must contain at least one uppercase letter",
            })
            .refine((value) => /[a-z]/.test(value), {
                message: "Password must contain at least one lowercase letter",
            })
            .refine((value) => /[0-9]/.test(value), {
                message: "Password must contain at least one number",
            })
            .refine((value) => /[!@#$%^&*(),.?":{}|<>]/.test(value), {
                message: "Password must contain at least one special character",
            }),
    }),
});
