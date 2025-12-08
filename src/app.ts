import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import errorHandler from "./utils/errorHandler";
import AppError from "./utils/AppError";

const app = express();

// 1. Security HTTP headers (always first)
app.use(helmet());

// 2. CORS (before body parsers & routes)
app.use(
    cors({
        origin: ["http://localhost:3000"], // or specific domains in production
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    })
);

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Cookie parser (needs parsed headers before routes)
app.use(cookieParser());

// 5. Routes
app.use("/api", router);

// 6. Healthcheck / root route (optional placement)
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to City Solution Server</title>
</head>
<body style="
    margin: 0;
    padding: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #0f172a, #1e293b, #334155);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f8fafc;
">

    <main style="
        width: 92%;
        max-width: 650px;
        padding: 2.5rem;
        border-radius: 1.5rem;
        backdrop-filter: blur(18px);
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        text-align: center;
        animation: fadeIn 0.7s ease-out;
    ">
        <h1 style="
            font-size: 2.8rem;
            font-weight: 800;
            margin-bottom: 1rem;
            background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        ">
            Fashion Brand Server
        </h1>

        <p style="
            font-size: 1.2rem;
            color: #e2e8f0;
            line-height: 1.8rem;
            margin-bottom: 2rem;
        ">
            Your server is running smoothly with optimized performance and modern architecture.
        </p>
    </main>

    <footer style="
        margin-top: 2rem;
        font-size: 0.9rem;
        color: #cbd5e1;
        opacity: 0.8;
    ">
        © All rights reserved
    </footer>

    <style>
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>

</body>
</html>
    `);
});

// 7. 404 handler (after routes)
app.use((req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// 8. Centralized error handler (last)
app.use(errorHandler);

export default app;
