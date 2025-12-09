import { Request, Response } from "express";
import mongoose from "mongoose";
import BlogCategory, { IBlogCategory, IBlogSubCategory } from "../models/blog_category.model";
import Blog from "../models/blog.model";
import AppError from "../utils/AppError";

// ✅ Create blog category
export const createBlogCategory = async (req: Request, res: Response) => {
    const category = await BlogCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
};

// ✅ Get all blog categories
export const getBlogCategories = async (_req: Request, res: Response) => {
    const categories = await BlogCategory.find();
    res.status(200).json({ success: true, data: categories });
};

// ✅ Get single blog category
export const getBlogCategory = async (req: Request, res: Response) => {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
        throw new AppError("Blog category not found", 404);
    }
    res.status(200).json({ success: true, data: category });
};

// Helper: recursively get all category & subcategory IDs
const getAllBlogCategoryIds = (category: IBlogCategory): string[] => {
    const ids: string[] = [category._id.toString()];

    const extractIds = (subCategories: IBlogSubCategory[]): void => {
        for (const subCategory of subCategories) {
            ids.push(subCategory._id.toString());
            if (subCategory.subCategories && subCategory.subCategories.length > 0) {
                extractIds(subCategory.subCategories);
            }
        }
    };

    if (category.subCategories && category.subCategories.length > 0) {
        extractIds(category.subCategories);
    }

    return ids;
};

// ✅ Update blog category
export const updateBlogCategory = async (req: Request, res: Response) => {
    const category: IBlogCategory | null = await BlogCategory.findById(req.params.id);
    if (!category) {
        throw new AppError("Blog category not found", 404);
    }

    const allCategoryIds: string[] = getAllBlogCategoryIds(category);
    const objectIds = allCategoryIds.map((id) => new mongoose.Types.ObjectId(id));

    const matchingBlogs = await Blog.find({
        "category._id": { $in: objectIds },
    }).lean();

    if (matchingBlogs.length > 0) {
        throw new AppError("Blog category is in use", 400);
    }

    const updatedCategory: IBlogCategory | null = await BlogCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    res.status(200).json({
        success: true,
        data: updatedCategory,
    });
};

// ✅ Delete blog category
export const deleteBlogCategory = async (req: Request, res: Response) => {
    const category: IBlogCategory | null = await BlogCategory.findById(req.params.id);
    if (!category) {
        throw new AppError("Blog category not found", 404);
    }

    const allCategoryIds: string[] = getAllBlogCategoryIds(category);
    const objectIds = allCategoryIds.map((id) => new mongoose.Types.ObjectId(id));

    const matchingBlogs = await Blog.find({
        "category._id": { $in: objectIds },
    }).lean();

    if (matchingBlogs.length > 0) {
        throw new AppError("Blog category is in use", 400);
    }

    await BlogCategory.findByIdAndDelete(req.params.id);
    res.status(204).send();
};
