/**
 * Profile Settings Validation Schemas
 *
 * SEC-005: Zod validation for profile editing
 * Phase 2: Authentication & Validation
 */

import { z } from 'zod';

/**
 * Profile Update Schema
 *
 * Validates user profile information
 */
export const profileSchema = z.object({
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

  fullName: z
    .string()
    .max(100, 'Full name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

/**
 * Password Change Schema
 *
 * Validates password change with confirmation
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .min(6, 'Password must be at least 6 characters'),

    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(72, 'Password must be less than 72 characters')
      .regex(
        /^(?=.*[a-z])/,
        'Password must contain at least one lowercase letter'
      ),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * TypeScript types inferred from schemas
 */
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
