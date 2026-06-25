import { z } from "zod";

const email = z.string().email().max(320).transform((value) => value.toLowerCase());
const password = z.string().min(12).max(160);
const pin = z.string().regex(/^\d{6}$/, "PIN must be exactly six digits");

export const registerSchema = z.object({
  body: z.object({
    email,
    password,
    firstName: z.string().min(1).max(120),
    lastName: z.string().min(1).max(120),
    phone: z.string().max(40).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({ email, password })
});

export const pinLoginSchema = z.object({
  body: z.object({ email, pin })
});

export const setPinSchema = z.object({
  body: z.object({ pin })
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(20) })
});

export const passwordResetRequestSchema = z.object({
  body: z.object({ email })
});

export const passwordResetConfirmSchema = z.object({
  body: z.object({
    token: z.string().min(20),
    password
  })
});
