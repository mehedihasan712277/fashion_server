import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import AppError from "../utils/AppError";

// Extend Express Request type so req.user is recognized
declare module "express-serve-static-core" {
    interface Request {
        user?: JwtPayload | string;
    }
}

export const identifier = (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        // 1. Handle client type
        if (req.headers["client"] === "not-browser") {
            token = req.headers["authorization"] as string | undefined;
        } else {
            token = req.cookies["Authorization"];
        }

        // 2. No token found
        if (!token) {
            return next(new AppError("Unauthorized: No token provided", 403));
        }

        // 3. Extract from "Bearer <token>"
        const userToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

        if (!userToken) {
            return next(new AppError("Unauthorized: Malformed token", 403));
        }

        // 4. Verify JWT
        const decoded = jwt.verify(userToken, env.TOKEN_SECRET);

        // 5. Attach user to request
        req.user = decoded;
        return next();
    } catch (error) {
        console.error("JWT verification error:", error);
        return next(new AppError("Unauthorized: Invalid or expired token", 403));
    }
};
