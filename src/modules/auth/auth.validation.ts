import { z } from "zod";

const emailSchema = z.string().email().transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(8).max(128);
const pinSchema = z.string().regex(/^\d{4,8}$/, "PIN must contain 4 to 8 digits");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().min(7).max(30).optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80)
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1)
});

export const setupPinSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  pin: pinSchema
});

export const pinLoginSchema = z.object({
  email: emailSchema,
  pin: pinSchema
});

export const firebaseLoginSchema = z.object({
  idToken: z.string().min(20),
  phone: z.string().min(7).max(30).optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SetupPinInput = z.infer<typeof setupPinSchema>;
export type PinLoginInput = z.infer<typeof pinLoginSchema>;
export type FirebaseLoginInput = z.infer<typeof firebaseLoginSchema>;
