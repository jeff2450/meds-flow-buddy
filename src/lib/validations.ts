import { z } from "zod";

// Shared validation schemas for form inputs

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z0-9\s\-_.()]+$/, "Name contains invalid characters");

export const medicineNameSchema = z
  .string()
  .trim()
  .min(1, "Medicine name is required")
  .max(200, "Medicine name must be less than 200 characters");

export const notesSchema = z
  .string()
  .trim()
  .max(500, "Notes must be less than 500 characters")
  .optional()
  .or(z.literal(""));

export const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(100000, "Quantity cannot exceed 100,000");

export const stockQuantitySchema = z
  .number()
  .int("Stock must be a whole number")
  .min(0, "Stock cannot be negative")
  .max(1000000, "Stock cannot exceed 1,000,000");

export const priceSchema = z
  .number()
  .min(0.01, "Price must be at least 0.01")
  .max(999999.99, "Price cannot exceed 999,999.99");

export const minStockLevelSchema = z
  .number()
  .int("Min stock level must be a whole number")
  .min(0, "Min stock level cannot be negative")
  .max(100000, "Min stock level cannot exceed 100,000");

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name must be less than 100 characters");

// Form schemas
export const addMedicineSchema = z.object({
  name: medicineNameSchema,
  categoryId: z.string().optional(),
  initialStock: stockQuantitySchema,
  minStockLevel: minStockLevelSchema,
});

export const transactionSchema = z.object({
  medicineId: z.string().min(1, "Please select a medicine"),
  quantity: quantitySchema,
  notes: notesSchema,
});

export const salesEntrySchema = z.object({
  medicineId: z.string().min(1, "Please select a medicine"),
  quantity: quantitySchema,
  unitPrice: priceSchema,
  notes: notesSchema,
});

export const workerRegistrationSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

// Helper function to validate and get error message
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { valid: boolean; error?: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, error: result.error.errors[0]?.message };
}
