/**
 * Schema Exports
 *
 * Central export point for all Zod validation schemas
 *
 * SEC-005: Phase 2 - Input validation with Zod
 */

// Auth schemas
export {
  signInSchema,
  signUpSchema,
  type SignInFormData,
  type SignUpFormData,
} from './auth';

// Profile schemas
export {
  profileSchema,
  passwordChangeSchema,
  type ProfileFormData,
  type PasswordChangeFormData,
} from './profile';

// Catch schemas
export {
  catchSchema,
  catchSchemaWithRefinements,
  validateCatchForm,
  type CatchFormData,
  weightUnits,
  lengthUnits,
  visibilityOptions,
  timeOfDayOptions,
  weatherOptions,
  waterClarityOptions,
  windDirectionOptions,
} from './catch';
