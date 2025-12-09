import { Router } from "express";
import {
    createBlogCategory,
    deleteBlogCategory,
    getBlogCategories,
    getBlogCategory,
    updateBlogCategory,
} from "../controllers/blog_category.controller";

import { identifier } from "../middlewares/indentifier.middleware";
import validateRequest from "../middlewares/validate.middleware";
import { createBlogCategorySchema, updateBlogCategorySchema } from "../schemas/blog_category.schema";

const router = Router();

router.get("/", getBlogCategories);
router.get("/:id", getBlogCategory);
router.post("/", identifier, validateRequest(createBlogCategorySchema), createBlogCategory);
router.put("/:id", identifier, validateRequest(updateBlogCategorySchema), updateBlogCategory);
router.delete("/:id", identifier, deleteBlogCategory);

export default router;
