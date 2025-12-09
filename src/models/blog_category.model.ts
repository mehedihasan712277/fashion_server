import mongoose, { Schema, Document, Model, model } from "mongoose";

// -----------------------------
// SubCategory interface
// -----------------------------
export interface IBlogSubCategory extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    subCategories: IBlogSubCategory[];
}

// -----------------------------
// Category interface
// -----------------------------
export interface IBlogCategory extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    subCategories: IBlogSubCategory[];
}

// -----------------------------
// SubCategory Schema
// -----------------------------
const BlogSubCategorySchema: Schema<IBlogSubCategory> = new Schema(
    {
        name: { type: String, required: true, trim: true },
        subCategories: { type: [Object], default: [] }, // placeholder for recursion
    },
    { _id: true }
);

// IMPORTANT: add recursion after defining schema
BlogSubCategorySchema.add({
    subCategories: [BlogSubCategorySchema],
});

// -----------------------------
// Category Schema
// -----------------------------
const BlogCategorySchema: Schema<IBlogCategory> = new Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        subCategories: { type: [BlogSubCategorySchema], default: [] },
    },
    { timestamps: true }
);

// -----------------------------
// Category Model
// -----------------------------
const BlogCategory: Model<IBlogCategory> = model<IBlogCategory>("BlogCategory", BlogCategorySchema);

export default BlogCategory;
