# Validation Schemas

This directory contains Zod validation schemas for all forms in the application.

**SEC-005: Phase 2 - Input Validation**

---

## Overview

All form validation is implemented using [Zod](https://zod.dev/) for:
- ✅ Type-safe validation
- ✅ Clear error messages
- ✅ TypeScript type inference
- ✅ Runtime safety

---

## Available Schemas

### Authentication (`auth.ts`)

**Sign In Schema**
```typescript
import { signInSchema, SignInFormData } from '@/schemas';

const result = signInSchema.safeParse(formData);
if (!result.success) {
  console.error(result.error.issues);
}
```

Fields:
- `email`: Required, valid email format
- `password`: Required, min 6 characters

**Sign Up Schema**
```typescript
import { signUpSchema, SignUpFormData } from '@/schemas';

const result = signUpSchema.safeParse(formData);
```

Fields:
- `username`: Required, 3-30 chars, alphanumeric + `_-`
- `email`: Required, valid email format
- `password`: Required, min 6 chars, must contain lowercase letter

---

### Profile (`profile.ts`)

**Profile Update Schema**
```typescript
import { profileSchema, ProfileFormData } from '@/schemas';

const result = profileSchema.safeParse(formData);
```

Fields:
- `username`: Required, 3-30 chars
- `fullName`: Optional, max 100 chars
- `email`: Required, valid email
- `bio`: Optional, max 500 chars

**Password Change Schema**
```typescript
import { passwordChangeSchema, PasswordChangeFormData } from '@/schemas';

const result = passwordChangeSchema.safeParse(formData);
```

Fields:
- `currentPassword`: Required, min 6 chars
- `newPassword`: Required, min 6 chars, must be different from current
- `confirmPassword`: Required, must match newPassword

Validations:
- ✅ New password ≠ current password
- ✅ Confirmation matches new password

---

### Catch (`catch.ts`)

**Catch Submission Schema**
```typescript
import { catchSchemaWithRefinements, CatchFormData } from '@/schemas';

const result = catchSchemaWithRefinements.safeParse(formData);
```

**Required Fields:**
- `title`: 1-200 chars
- `species`: 1-100 chars
- `location`: 1-200 chars
- `caughtAt`: Valid date (YYYY-MM-DD), not in future

**Optional Fields:**
- `weight`: Positive number string
- `length`: Positive number string
- `description`: Max 2000 chars
- `method`, `baitUsed`, `equipmentUsed`: Various max lengths
- `timeOfDay`: Enum (dawn, morning, etc.)
- `weather`: Enum (sunny, cloudy, etc.)
- `waterClarity`: Enum (clear, stained, etc.)
- `windDirection`: Enum (N, NE, E, etc.)
- `visibility`: Enum (public, private, friends)
- `hideExactSpot`: Boolean
- `allowRatings`: Boolean

**Cross-field Validations:**
- Weight must be > 0 if provided
- Length must be > 0 if provided
- Air temp must be between -50°C and 60°C

---

## Usage with React Hook Form

### Basic Integration

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from '@/schemas';

function LoginForm() {
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    // Data is validated and type-safe
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Display Error Messages

```typescript
<Input
  {...form.register('email')}
  aria-invalid={!!form.formState.errors.email}
/>
{form.formState.errors.email && (
  <p className="text-sm text-destructive">
    {form.formState.errors.email.message}
  </p>
)}
```

---

## Validation Rules

### Email Validation
- Must be valid email format
- Automatically lowercased
- Automatically trimmed

### Password Validation
- Minimum 6 characters
- Maximum 72 characters (bcrypt limit)
- Must contain at least one lowercase letter

### Username Validation
- 3-30 characters
- Only letters, numbers, underscores, and hyphens
- No spaces or special characters

### Numeric Fields (weight, length, temperature)
- Must be valid numbers
- Weight/length must be positive if provided
- Temperature must be in reasonable range (-50 to 60°C)

### Date Validation
- Must be in YYYY-MM-DD format
- Cannot be in the future

### URL Validation
- Must be valid URL format
- Used for video links

---

## Testing Schemas

### Unit Test Example

```typescript
import { signInSchema } from '@/schemas';

describe('signInSchema', () => {
  it('validates correct email and password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid email');
    }
  });

  it('rejects short password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 6');
    }
  });
});
```

---

## Browser Console Testing

You can test schemas directly in the browser console:

```javascript
// Import from window if exposed (dev only)
const { signInSchema } = await import('/src/schemas/index.ts');

// Test valid data
const result = signInSchema.safeParse({
  email: 'test@example.com',
  password: 'password123',
});

console.log('Valid?', result.success);
if (!result.success) {
  console.log('Errors:', result.error.issues);
}
```

---

## Adding New Schemas

### Step 1: Create Schema File

```typescript
// src/schemas/my-feature.ts
import { z } from 'zod';

export const myFeatureSchema = z.object({
  field1: z.string().min(1, 'Field 1 is required'),
  field2: z.number().positive(),
});

export type MyFeatureFormData = z.infer<typeof myFeatureSchema>;
```

### Step 2: Export from Index

```typescript
// src/schemas/index.ts
export {
  myFeatureSchema,
  type MyFeatureFormData,
} from './my-feature';
```

### Step 3: Use in Component

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { myFeatureSchema, MyFeatureFormData } from '@/schemas';

const form = useForm<MyFeatureFormData>({
  resolver: zodResolver(myFeatureSchema),
});
```

---

## Best Practices

### ✅ Do

- Use `.trim()` for string fields to remove whitespace
- Use `.toLowerCase()` for emails
- Provide clear error messages
- Use enums for limited sets of values
- Add cross-field validation with `.refine()`
- Infer TypeScript types from schemas

### ❌ Don't

- Don't duplicate validation logic (use schema everywhere)
- Don't use HTML validation if Zod is used (rely on Zod)
- Don't forget to handle `optional()` fields properly
- Don't make error messages too technical

---

## Error Message Guidelines

**Good Error Messages:**
- ✅ "Email is required"
- ✅ "Password must be at least 6 characters"
- ✅ "Username can only contain letters, numbers, underscores, and hyphens"

**Bad Error Messages:**
- ❌ "Invalid input"
- ❌ "Validation error"
- ❌ "Field does not match regex pattern"

---

## Security Considerations

### Client-Side Validation Alone is NOT Enough

⚠️ **Important:** Zod validation in the browser can be bypassed. **Always validate on the server as well**.

Supabase/PostgreSQL provides server-side validation:
- RLS policies (already implemented in Phase 1)
- Database constraints (NOT NULL, CHECK, etc.)
- Triggers for complex validation

Zod helps with:
- ✅ Better UX (instant feedback)
- ✅ Type safety in TypeScript
- ✅ Consistent validation logic
- ✅ Prevention of accidental bad data

---

## Performance

Zod validation is very fast:
- Typical form: < 1ms validation time
- Complex forms: < 5ms validation time
- No noticeable impact on UX

---

## Related Documentation

- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Phase 2 Plan](../../../docs/phase-2-plan.md)
- [Risk Register - SEC-005](../../../docs/risk-register.md)

---

## Questions?

If validation isn't working as expected:

1. Check browser console for validation errors
2. Ensure `zodResolver` is passed to `useForm()`
3. Verify field names match schema keys exactly
4. Test schema directly with `.safeParse()`

---

**Status:** ✅ Phase 2 - Schemas created
**Next:** Integrate with forms (AddCatch, ProfileSettings, Auth)
