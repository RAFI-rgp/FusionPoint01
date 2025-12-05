import express from "express";
import { 
    getChatMessages, 
    sendMessage, 
    sseController 
} from "../controllers/messageController.js";

import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";

const messageRouter = express.Router();


// ------------------------ SSE LISTENER ------------------------
messageRouter.get("/sse/:userId", protect, sseController);


// ------------------------ SEND MESSAGE ------------------------
messageRouter.post(
    "/send",
    protect,
    upload.single("image"),
    sendMessage
);


// ------------------------ GET CHAT MESSAGES ------------------------
messageRouter.post(
    "/get",
    protect,
    getChatMessages
);


export default messageRouter;
