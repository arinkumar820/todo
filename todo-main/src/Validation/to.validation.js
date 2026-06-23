import mongoose from "mongoose";
import{z}   from "zod";


const createtodoSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters long" }),
    description: z.string().min(5, { message: "Description must be at least 5 characters long" }),
    completed: z.boolean().optional(),
});