// CHANGED: Fixed typo in transform, removed the description field requirement to match model/UI,
// and added category & dueDate fields. Added named/default exports for the schemas,
// including a partial update schema to support single-field updates like toggles.
import { z } from "zod";

export const createtodoSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long" }).transform((val) => val.trim()),
  category: z.string().optional(),
  dueDate: z.string().optional(),
  completed: z.boolean().optional(),
});

export const updatetodoSchema = createtodoSchema.partial();

export default createtodoSchema;