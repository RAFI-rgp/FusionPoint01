export const protect = async (req, res, next) => {
  try {
    let authData = null;

    // Case 1: req.auth() exists (Clerk middleware v5+)
    if (typeof req.auth === "function") {
      authData = await req.auth();
    }

    // Case 2: req.auth object exists (older Clerk versions)
    else if (typeof req.auth === "object") {
      authData = req.auth;
    }

    // Extract userId safely
    const userId =
      authData?.userId ||
      authData?.user_id ||
      req.userId || // fallback
      null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Attach to request
    req.userId = userId;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
