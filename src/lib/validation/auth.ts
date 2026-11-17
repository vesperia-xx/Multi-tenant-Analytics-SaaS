import { z } from "zod";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth-constants";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(160, "Email is too long.")
  .pipe(z.email({ error: "Enter a valid email address." }));

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`)
  .refine((value) => /[a-zA-Z]/.test(value), "Include at least one letter.")
  .refine((value) => /\d/.test(value), "Include at least one number.");

const personName = z
  .string()
  .trim()
  .min(2, "Enter your name.")
  .max(80, "Name is too long.");

const organizationName = z
  .string()
  .trim()
  .min(2, "Enter a workspace name.")
  .max(60, "Workspace name is too long.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH),
});

export const registerSchema = z.object({
  name: personName,
  email,
  organizationName,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "This reset link is invalid."),
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Collapses a Zod error into one message per field, which is what the forms
 * render. Zod's own flattening nests objects, so a flat map is simpler here.
 */
export function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const [first] = issue.path;
    if (typeof first === "string" && !fieldErrors[first]) {
      fieldErrors[first] = issue.message;
    }
  }

  return fieldErrors;
}
