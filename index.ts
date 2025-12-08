import { env } from "./src/config/env"; // ✅ use validated env
import app from "./src/app";
import connectDB from "./src/config/db";

connectDB().then(() => {
    app.listen(env.PORT, () => {
        console.log(`🚀 Server running on ${env.PORT}`);
    });
});
