import { Router } from "express";

import userRoutes from "./user.routes";
import blog_categoryRoutes from "./blog_category.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/blog-categories", blog_categoryRoutes);

export default router;
