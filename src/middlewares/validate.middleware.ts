import { ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";

const validateRequest = (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const formatted = error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            }));

            return next(new AppError("Validation Error", 400, formatted));
        }

        next(error);
    }
};

export default validateRequest;
