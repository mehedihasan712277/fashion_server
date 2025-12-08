import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { z } from "zod";
import { loginUserSchema, registerUserSchema } from "../schemas/user.schema";
import { createHmac, timingSafeEqual } from "crypto";
import { transport } from "../utils/sendMail";

type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];
type LoginUserInput = z.infer<typeof loginUserSchema>["body"];
interface TokenPayload extends JwtPayload {
    userId: string;
    verified: boolean;
}
export const getUsers = async (req: Request, res: Response) => {
    const data = await User.find();
    res.status(200).json({
        success: true,
        data: data,
    });
};

export const registerUser = async (req: Request<{}, {}, RegisterUserInput>, res: Response) => {
    const { name, email, password } = req.body;

    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new user
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
    });
    await newUser.save();

    // generate JWT
    const token = jwt.sign(
        {
            userId: newUser._id,
            email: newUser.email,
            verified: newUser.verified,
        },
        env.TOKEN_SECRET,
        { expiresIn: "8h" }
    );

    // set cookie
    res.cookie("Authorization", `Bearer ${token}`, {
        expires: new Date(Date.now() + 8 * 3600000), // 8h
        httpOnly: true, // Always true for security
        secure: env.NODE_ENV === "production", // Only HTTPS in production
        sameSite: env.NODE_ENV === "production" ? "none" : "lax", // Critical fix
        path: "/",
    });

    res.status(201).json({
        success: true,
        token,
        message: "Account created successfully",
    });
};

export const loginUser = async (req: Request<{}, {}, LoginUserInput>, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
        return res.status(401).json({
            success: false,
            message: "User does not exists or Invalid email",
        });
    }
    const result = await bcrypt.compare(password, existingUser.password);
    if (!result) {
        return res.status(401).json({ success: false, message: "Wrong password!" });
    }
    // generate JWT
    const token = jwt.sign(
        {
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified,
        },
        env.TOKEN_SECRET,
        { expiresIn: "8h" }
    );

    // set cookie
    res.cookie("Authorization", `Bearer ${token}`, {
        expires: new Date(Date.now() + 8 * 3600000), // 8h
        httpOnly: true, // Always true for security
        secure: env.NODE_ENV === "production", // Only HTTPS in production
        sameSite: env.NODE_ENV === "production" ? "none" : "lax", // Critical fix
        path: "/",
    });

    res.status(200).json({
        success: true,
        token,
        message: "Logged in successfully",
    });
};

export const logOut = async (req: Request, res: Response) => {
    // Clear cookie with same options as when it was set
    res.clearCookie("Authorization", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
    })
        .status(200)
        .json({ success: true, message: "logged out successfully" });
};

export const sendVerificationCode = async (req: Request, res: Response) => {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        return res.status(404).json({ success: false, message: "User does not exists!" });
    }
    if (existingUser.verified) {
        return res.status(400).json({ success: false, message: "You are already verified!" });
    }
    const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

    let info = await transport.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: existingUser.email,
        subject: "verification code",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                    <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
                    <p style="font-size: 16px; color: #333;">Dear User,</p>
                    <p style="font-size: 16px; color: #333;">Your verification code is:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
                        ${codeValue}
                        </span>
                    </div>
                    <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
                    <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
                    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
                        <p>Thank you,<br>Your Company Team</p>
                        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
                    </footer>
                </div>
        `,
    });

    if (info.accepted[0] === existingUser.email) {
        const hashedCodeValue = createHmac("sha256", env.HMAC_VERIFICATION_CODE_SECRET).update(codeValue).digest("hex");
        existingUser.verificationCode = hashedCodeValue;
        existingUser.verificationCodeValidation = Date.now();
        await existingUser.save();
        return res.status(200).json({ success: true, message: "Code sent!" });
    }
    res.status(400).json({ success: false, message: "Code sent failed!" });
};

export const verifyVerificationCode = async (req: Request, res: Response) => {
    const { email, providedCode } = req.body;
    const codeValue = providedCode.toString();

    const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation");

    if (!existingUser) {
        return res.status(404).json({ success: false, message: "User not found!" });
    }

    if (existingUser.verified) {
        return res.status(409).json({ success: false, message: "User already verified!" });
    }

    if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
        return res.status(400).json({
            success: false,
            message: "No verification code found, please request again.",
        });
    }

    // ⏰ Expiry check (10 minutes)
    const isExpired = Date.now() - existingUser.verificationCodeValidation > 10 * 60 * 1000;
    if (isExpired) {
        return res.status(400).json({ success: false, message: "Verification code expired!" });
    }

    // 🔐 Hash the provided code
    const hashedCodeValue = createHmac("sha256", env.HMAC_VERIFICATION_CODE_SECRET).update(codeValue).digest("hex");

    // ✅ Safer comparison
    const providedBuffer = Buffer.from(hashedCodeValue, "hex");
    const storedBuffer = Buffer.from(existingUser.verificationCode, "hex");

    if (providedBuffer.length === storedBuffer.length && timingSafeEqual(providedBuffer, storedBuffer)) {
        existingUser.verified = true;
        existingUser.verificationCode = null;
        existingUser.verificationCodeValidation = null;
        await existingUser.save();

        return res.status(200).json({
            success: true,
            message: "Account verified successfully!",
        });
    }

    return res.status(400).json({ success: false, message: "Invalid verification code." });
};

export const sendForgotPasswordCode = async (req: Request, res: Response) => {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        return res.status(404).json({ success: false, message: "User does not exists!" });
    }

    const codeValue = Math.floor(100000 + Math.random() * 900000).toString();

    let info = await transport.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: existingUser.email,
        subject: "Forgot Password Verification code",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                    <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
                    <p style="font-size: 16px; color: #333;">Dear User,</p>
                    <p style="font-size: 16px; color: #333;">Your verification code is:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
                        ${codeValue}
                        </span>
                    </div>
                    <p style="font-size: 16px; color: #333;">Please use this code to set new password. The code will expire in 10 minutes.</p>
                    <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
                    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
                        <p>Thank you,<br>The Kahaf</p>
                        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
                    </footer>
                </div>
        `,
    });

    if (info.accepted[0] === existingUser.email) {
        const hashedCodeValue = createHmac("sha256", env.HMAC_VERIFICATION_CODE_SECRET).update(codeValue).digest("hex");
        existingUser.forgotPasswordCode = hashedCodeValue;
        existingUser.forgotPasswordCodeValidation = Date.now();
        await existingUser.save();
        return res.status(200).json({ success: true, message: "Code sent!" });
    }
    res.status(400).json({ success: false, message: "Code sent failed!" });
};
export const verifyForgotPasswordCodeAndUpdatePassword = async (req: Request, res: Response) => {
    const { email, providedCode, newPassword } = req.body;
    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select("+forgotPasswordCode +forgotPasswordCodeValidation");

    if (!existingUser) {
        return res.status(401).json({ success: false, message: "User does not exists!" });
    }

    if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
        return res.status(400).json({
            success: false,
            message: "something is wrong with the code!",
        });
    }
    if (Date.now() - existingUser.forgotPasswordCodeValidation > 2 * 60 * 1000) {
        return res.status(400).json({ success: false, message: "code has been expired!" });
    }
    const hashedCodeValue = createHmac("sha256", env.HMAC_VERIFICATION_CODE_SECRET).update(codeValue).digest("hex");

    if (hashedCodeValue === existingUser.forgotPasswordCode) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        existingUser.password = hashedPassword;
        existingUser.forgotPasswordCode = null;
        existingUser.forgotPasswordCodeValidation = null;
        await existingUser.save();
        return res.status(200).json({ success: true, message: "Password updated!!" });
    }
    return res.status(400).json({ success: false, message: "unexpected occured!!" });
};
export const changePassword = async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;

    // ✅ Extract token from Authorization cookie
    const authCookie = req.cookies?.Authorization;
    if (!authCookie) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authCookie.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "Invalid token format" });
    }

    // ✅ Verify and decode token
    let decoded: TokenPayload;
    try {
        decoded = jwt.verify(token, env.TOKEN_SECRET) as TokenPayload;
    } catch {
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
    const data = await User.findById(decoded.userId);

    // ✅ Check if user is verified
    if (!data?.verified as boolean) {
        return res.status(401).json({
            success: false,
            message: "You are not a verified user!",
        });
    }

    // ✅ Find user in DB
    const existingUser = await User.findById(decoded.userId).select("+password");
    if (!existingUser) {
        return res.status(404).json({ success: false, message: "User does not exist!" });
    }

    // ✅ Validate old password
    const isMatch = await bcrypt.compare(oldPassword, existingUser.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials!" });
    }

    // ✅ Hash new password and update
    existingUser.password = await bcrypt.hash(newPassword, 10);
    await existingUser.save();

    return res.status(200).json({ success: true, message: "Password updated!" });
};
