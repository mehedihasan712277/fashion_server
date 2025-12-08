import { Request, Response, NextFunction } from "express";
import AppError from "./AppError";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error("❌ Error:", err);

    // Normalize into AppError
    let appError: AppError;

    if (err instanceof AppError) {
        appError = err;
    }
    // Handle Mongo duplicate key error
    else if (err instanceof MongoServerError && err.code === 11000) {
        const fields = Object.keys(err.keyValue ?? {});
        const message = `Duplicate value entered for ${fields.join(", ")} field(s).`;
        appError = new AppError(message, 400);
    }
    // Handle Mongoose CastError
    else if (err instanceof mongoose.Error.CastError) {
        const message = `Invalid value for ${err.path}: ${err.value}`;
        appError = new AppError(message, 400);
    }
    // Handle Mongoose ValidationError
    else if (err instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(err.errors).map((el: any) => ({
            path: el.path,
            message: el.message,
        }));
        appError = new AppError("Validation failed", 400, errors);
    }
    // Unknown error → fallback
    else if (err instanceof Error) {
        appError = new AppError(err.message || "Something went wrong!", 500);
    } else {
        appError = new AppError("Unknown error occurred", 500);
    }

    res.status(appError.statusCode).json({
        status: "error",
        message: appError.message,
        errors: appError.errors,
    });
};

export default errorHandler;
