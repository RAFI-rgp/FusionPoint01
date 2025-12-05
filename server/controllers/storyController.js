import fs from "fs";
import imagekit from "../configs/imagekit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

// Add User Story
export const addUserStory = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content, media_type, background_color } = req.body;
        const media = req.file; // media = image or video

        let media_url = "";

        // Upload media to ImageKit
        if (media && (media_type === "image" || media_type === "video")) {
            const buffer = fs.readFileSync(media.path);

            const uploaded = await imagekit.upload({
                file: buffer,
                fileName: media.originalname,
                folder: "stories",
            });

            media_url = imagekit.url({
                path: uploaded.filePath,
                transformation:
                    media_type === "image"
                        ? [
                              { quality: "auto" },
                              { format: "webp" },
                              { width: "1080" },
                          ]
                        : [],
            });
        }

        // Create Story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color,
        });

        // STORY DELETE AFTER 24 HOURS
        await inngest.send({
            name: "app/story.delete",
            data: { storyId: story._id },
        });

        res.json({ success: true, story });
    } catch (error) {
        console.log("Story Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get Stories
export const getStories = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await User.findById(userId);

        // Fetch user + followers + connections
        const userIds = [userId, ...user.connections, ...user.following];

        const stories = await Story.find({
            user: { $in: userIds },
        })
            .populate("user")
            .sort({ createdAt: -1 });

        res.json({ success: true, stories });
    } catch (error) {
        console.log("Get story error:", error);
        res.json({ success: false, message: error.message });
    }
};
