/**
 * Authentication Form Validation Schemas
 *
 * SEC-005: Zod validation for login and signup forms
 * Phase 2: Authentication & Validation
 */

import { z } from 'zod';

/**
 * Sign In Schema
 *
 * Validates email and password for login
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * Sign Up Schema
 *
 * Validates username, email, and password for registration
 */
export const signUpSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .trim(),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be less than 72 characters')
    .regex(
      /^(?=.*[a-z])/,
      'Password must contain at least one lowercase letter'
    ),
});

/**
 * TypeScript types inferred from schemas
 */
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
