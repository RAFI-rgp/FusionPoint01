import express from "express";
import { 
    acceptConnectionRequest,
    discoverUsers,
    followUser,
    getUserConnections,
    getUserData,
    getUserProfiles,
    sendConnectionRequest,
    unfollowUser,
    updateUserData
} from "../controllers/userController.js";

import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import { getUserRecentMessages } from "../controllers/messageController.js";

const userRouter = express.Router();

// Get logged user data
userRouter.get("/data", protect, getUserData);

// Update user (profile + cover)
userRouter.post(
    "/update",
    protect,
    upload.fields([
        { name: "profile", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    updateUserData
);

// Search users
userRouter.post("/discover", protect, discoverUsers);

// Follow / Unfollow
userRouter.post("/follow", protect, followUser);
userRouter.post("/unfollow", protect, unfollowUser);

// Connection
userRouter.post("/connect", protect, sendConnectionRequest);
userRouter.post("/accept", protect, acceptConnectionRequest);

// Get all connections
userRouter.get("/connections", protect, getUserConnections);

// Profile page user info + posts
userRouter.post("/profile", protect, getUserProfiles);

// Recent messages
userRouter.get("/recent-messages", protect, getUserRecentMessages);

export default userRouter;
