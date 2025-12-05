import fs from "fs";
import imagekit from "../configs/imagekit.js";
import Message from "../models/Message.js";

// Active SSE connections
const connections = {};


// --------------------- SSE CONTROLLER ---------------------
export const sseController = (req, res) => {
    const { userId } = req.params;
    console.log("New client connected:", userId);

    //SSE Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    connections[userId] = res;

    res.write("data: Connected to SSE stream\n\n");

    //Handle disconnect
    res.on("close", () => {
        delete connections[userId];
        console.log("Client disconnected");
    });
};


// --------------------- SEND MESSAGE ---------------------
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id, text } = req.body;
        const image = req.file;

        let media_url = "";
        const message_type = image ? "image" : "text";

        // Upload image if exists
        if (image) {
            const fileBuffer = fs.readFileSync(image.path);

            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
            });

            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: "auto" },
                    { format: "webp" },
                    { width: "1280" },
                ],
            });
        }

        // Save message
        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url,
        });

        const messageWithUserData = await Message.findById(message._id)
            .populate("from_user_id")
            .populate("to_user_id");

        res.json({ success: true, message: messageWithUserData });

        //Send message live to receiver using SSE
        if (connections[to_user_id]) {
            connections[to_user_id].write(
                `data: ${JSON.stringify(messageWithUserData)}\n\n`
            );
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


// --------------------- GET CHAT MESSAGES ---------------------
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id } = req.body;

        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id: to_user_id },
                { from_user_id: to_user_id, to_user_id: userId },
            ],
        })
            .sort({ createdAt: -1 })
            .populate("from_user_id to_user_id");

        // Mark as seen
        await Message.updateMany(
            { from_user_id: to_user_id, to_user_id: userId },
            { seen: true }
        );

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


// --------------------- GET RECENT MESSAGES ---------------------
export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth();

        const messages = await Message.find({
            to_user_id: userId,
        })
            .populate("from_user_id to_user_id")
            .sort({ createdAt: -1 });

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
