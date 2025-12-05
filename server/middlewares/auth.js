import { getAuth } from "@clerk/express";

export const protect = (req, res, next) => {
  try {
    const { userId } = getAuth(req);  // Clerk থেকে userId পাওয়া যায়

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    req.userId = userId;  // request object এ userId যোগ করা
    next();
  } catch (error) {
    console.log("Protect Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Middleware error",
    });
  }
};
