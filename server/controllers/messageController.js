import imagekit from "../configs/imagekit.js";
import Message from "../models/Message.js";

// Active SSE connections
const connections = {};


// -------------------------------------------------------
// SSE Controller
// -------------------------------------------------------
export const sseController = (req, res) => {
    const { userId } = req.params;

    console.log("SSE client connected:", userId);

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.flushHeaders();

    // Store connection
    connections[userId] = res;

    res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

    // Handle disconnect
    req.on("close", () => {
        delete connections[userId];
        console.log(`SSE client disconnected: ${userId}`);
    });
};



// -------------------------------------------------------
// SEND MESSAGE
// -------------------------------------------------------
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id, text } = req.body;

        let media_url = "";
        const isImage = req.file ? true : false;
        const message_type = isImage ? "image" : "text";

        // ------------------ IMAGE UPLOAD ------------------
        if (isImage) {
            const uploaded = await imagekit.upload({
                file: req.file.buffer,
                fileName: `msg_${Date.now()}.jpg`,
                folder: "/messages"
            });

            media_url = imagekit.url({
                path: uploaded.filePath,
                transformation: [
                    { quality: "auto" },
                    { format: "webp" },
                    { width: 1280 }
                ]
            });
        }

        // ------------------ SAVE MESSAGE ------------------
        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        });

        const messageWithData = await Message.findById(message._id)
            .populate("from_user_id")
            .populate("to_user_id");

        res.json({ success: true, message: messageWithData });

        // ------------------ PUSH MESSAGE VIA SSE ------------------
        if (connections[to_user_id]) {
            connections[to_user_id].write(
                `data: ${JSON.stringify(messageWithData)}\n\n`
            );
        }

    } catch (error) {
        console.log("Send Message Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



// -------------------------------------------------------
// GET CHAT MESSAGES (Between 2 Users)
// -------------------------------------------------------
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id } = req.body;

        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id },
                { from_user_id: to_user_id, to_user_id: userId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate("from_user_id to_user_id");

        // Mark messages as seen
        await Message.updateMany(
            { from_user_id: to_user_id, to_user_id: userId, seen: false },
            { seen: true }
        );

        res.json({ success: true, messages });

    } catch (error) {
        console.log("Get Chat Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



// -------------------------------------------------------
// GET RECENT MESSAGES (Inbox Sidebar)
// -------------------------------------------------------
export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth();

        const messages = await Message.find({
            to_user_id: userId
        })
            .populate("from_user_id to_user_id")
            .sort({ createdAt: -1 });

        res.json({ success: true, messages });

    } catch (error) {
        console.log("Recent Messages Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
