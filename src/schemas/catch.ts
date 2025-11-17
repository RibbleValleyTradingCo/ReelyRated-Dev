/**
 * Catch Submission Validation Schema
 *
 * SEC-005: Zod validation for AddCatch form
 * Phase 2: Authentication & Validation
 */

import { z } from 'zod';

/**
 * Weight units supported by the database
 * Matches: Database["public"]["Enums"]["weight_unit"]
 */
export const weightUnits = ['lb_oz', 'kg'] as const;

/**
 * Length units supported by the database
 * Matches: Database["public"]["Enums"]["length_unit"]
 */
export const lengthUnits = ['cm', 'in'] as const;

/**
 * Visibility options for catch posts
 * Matches: Database["public"]["Enums"]["visibility_type"]
 */
export const visibilityOptions = ['public', 'followers', 'private'] as const;

/**
 * Time of day options
 * Matches: Database["public"]["Enums"]["time_of_day"]
 */
export const timeOfDayOptions = [
  'morning',
  'afternoon',
  'evening',
  'night',
] as const;

/**
 * Weather condition options
 * Matches: Database["public"]["Enums"]["weather_type"]
 */
export const weatherOptions = [
  'sunny',
  'overcast',
  'raining',
  'windy',
] as const;

/**
 * Water clarity options
 * Matches: Database["public"]["Enums"]["water_clarity"]
 */
export const waterClarityOptions = [
  'clear',
  'coloured',
  'unknown',
] as const;

/**
 * Wind direction options (stored in conditions JSON)
 */
export const windDirectionOptions = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
] as const;

/**
 * Catch Submission Schema
 *
 * Validates all fields from the AddCatch form
 */
export const catchSchema = z.object({
  // Required fields
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),

  species: z
    .string()
    .min(1, 'Species is required')
    .max(100, 'Species name must be less than 100 characters')
    .trim(),

  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  caughtAt: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      return parsed <= now;
    }, 'Date cannot be in the future'),

  // Optional fields with validation
  customSpecies: z
    .string()
    .max(100, 'Custom species must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  weight: z
    .string()
    .max(20, 'Weight value is too long')
    .regex(/^\d*\.?\d*$/, 'Weight must be a valid number')
    .trim()
    .optional()
    .or(z.literal('')),

  weightUnit: z.enum(weightUnits).default('lb_oz'),

  length: z
    .string()
    .max(20, 'Length value is too long')
    .regex(/^\d*\.?\d*$/, 'Length must be a valid number')
    .trim()
    .optional()
    .or(z.literal('')),

  lengthUnit: z.enum(lengthUnits).default('cm'),

  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  customLocationLabel: z
    .string()
    .max(200, 'Custom location must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  pegOrSwim: z
    .string()
    .max(50, 'Peg/swim must be less than 50 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  waterType: z
    .string()
    .max(50, 'Water type must be less than 50 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  method: z
    .string()
    .max(100, 'Method must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  customMethod: z
    .string()
    .max(100, 'Custom method must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  baitUsed: z
    .string()
    .max(200, 'Bait description must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  equipmentUsed: z
    .string()
    .max(500, 'Equipment description must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  timeOfDay: z
    .enum(timeOfDayOptions)
    .or(z.literal(''))
    .optional(),

  weather: z
    .enum(weatherOptions)
    .or(z.literal(''))
    .optional(),

  airTemp: z
    .string()
    .max(10, 'Temperature value is too long')
    .regex(/^-?\d*\.?\d*$/, 'Temperature must be a valid number')
    .trim()
    .optional()
    .or(z.literal('')),

  waterClarity: z
    .enum(waterClarityOptions)
    .or(z.literal(''))
    .optional(),

  windDirection: z
    .enum(windDirectionOptions)
    .or(z.literal(''))
    .optional(),

  tags: z
    .string()
    .max(500, 'Tags must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  videoUrl: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val || val === '') return true; // Allow empty
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Please enter a valid URL' }
    )
    .optional()
    .or(z.literal('')),

  visibility: z.enum(visibilityOptions).default('public'),

  hideExactSpot: z.boolean().default(false),

  allowRatings: z.boolean().default(true),
});

/**
 * Catch Schema with refinements
 *
 * Adds cross-field validation rules
 */
export const catchSchemaWithRefinements = catchSchema.refine(
  (data) => {
    // If weight is provided, it must be a positive number
    if (data.weight && data.weight !== '') {
      const weightNum = parseFloat(data.weight);
      return weightNum > 0;
    }
    return true;
  },
  {
    message: 'Weight must be greater than 0',
    path: ['weight'],
  }
).refine(
  (data) => {
    // If length is provided, it must be a positive number
    if (data.length && data.length !== '') {
      const lengthNum = parseFloat(data.length);
      return lengthNum > 0;
    }
    return true;
  },
  {
    message: 'Length must be greater than 0',
    path: ['length'],
  }
).refine(
  (data) => {
    // If air temp is provided, it must be a reasonable value (-50 to 60°C)
    if (data.airTemp && data.airTemp !== '') {
      const temp = parseFloat(data.airTemp);
      return temp >= -50 && temp <= 60;
    }
    return true;
  },
  {
    message: 'Temperature must be between -50°C and 60°C',
    path: ['airTemp'],
  }
);

/**
 * TypeScript type inferred from schema
 */
export type CatchFormData = z.infer<typeof catchSchema>;

/**
 * Helper: Validate catch form data
 *
 * Usage:
 * const result = validateCatchForm(formData);
 * if (!result.success) {
 *   console.error(result.error.issues);
 * }
 */
export function validateCatchForm(data: unknown) {
  return catchSchemaWithRefinements.safeParse(data);
}
