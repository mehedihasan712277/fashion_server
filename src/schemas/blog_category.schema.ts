import { z } from "zod";

// ✅ Utility to check valid MongoDB ObjectId (24 hex chars)
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid ObjectId format" });

// ✅ Recursive subCategory schema (self-referencing)
const blogSubCategorySchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        _id: objectIdSchema.optional(),
        name: z.string().nonempty({ message: "Sub-category name is required" }).min(2, {
            message: "Sub-category name must have at least 2 characters",
        }),
        subCategories: z.array(blogSubCategorySchema).optional(),
    })
);

// ✅ Create BlogCategory Schema
export const createBlogCategorySchema = z.object({
    body: z.object({
        name: z.string().nonempty({ message: "Category name is required" }).min(2, {
            message: "Category name must have at least 2 characters",
        }),
        subCategories: z.array(blogSubCategorySchema).optional(),
    }),
});

// ✅ Update BlogCategory Schema
export const updateBlogCategorySchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, {
                message: "Category name must have at least 2 characters",
            })
            .optional(),
        subCategories: z.array(blogSubCategorySchema).optional(),
    }),
});

// ✅ TS types
// export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>["body"];
// export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>["body"];
