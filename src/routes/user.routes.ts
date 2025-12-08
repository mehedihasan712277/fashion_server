import { Router } from "express";
import validateRequest from "../middlewares/validate.middleware";
import {
    forgotPasswordSchema,
    loginUserSchema,
    registerUserSchema,
    changePasswordSchema,
    verifyEmailSchema,
    verifyVerificationSchema,
} from "../schemas/user.schema";
import {
    registerUser,
    loginUser,
    logOut,
    changePassword,
    sendVerificationCode,
    verifyVerificationCode,
    sendForgotPasswordCode,
    verifyForgotPasswordCodeAndUpdatePassword,
    getUsers,
} from "../controllers/user.controller";
import { identifier } from "../middlewares/indentifier.middleware";

const router = Router();

router.get("/admin", identifier, getUsers);
router.post("/register", validateRequest(registerUserSchema), registerUser);
router.post("/login", validateRequest(loginUserSchema), loginUser);
router.post("/logout", identifier, logOut);
router.patch("/send-verification-code", identifier, validateRequest(verifyEmailSchema), sendVerificationCode);
router.patch("/verify-verification-code", identifier, validateRequest(verifyVerificationSchema), verifyVerificationCode);
router.patch("/change-password", identifier, validateRequest(changePasswordSchema), changePassword);
router.patch("/send-forgot-password-verification-code", validateRequest(verifyEmailSchema), sendForgotPasswordCode);
router.patch("/verify-forgot-password-verification-code", validateRequest(forgotPasswordSchema), verifyForgotPasswordCodeAndUpdatePassword);
export default router;
