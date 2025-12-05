import express from "express";
import cors from "cors";
import "dotenv/config.js";
import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

// Import Routes
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();

// Connect Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Clerk Middleware (must be applied BEFORE routes)
app.use(clerkMiddleware());

// Test Route
app.get("/", (req, res) => res.send("Server is running 🚀"));

// Inngest
app.use("/api/inngest", serve({ client: inngest, functions }));

// API Routes
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/story", storyRouter);
app.use("/api/message", messageRouter);

// Server Listen
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server is running on port ${PORT}`)
);
