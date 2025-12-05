import imagekit from "../configs/imagekit.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/Connection.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import fs from "fs";

// get User data using ClerkId
export const getUserData = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update user data
export const updateUserData = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    let { username, bio, location, full_name } = req.body;

    if (!username) username = user.username;

    // Check duplicate username
    if (user.username !== username) {
      const userExist = await User.findOne({ username });
      if (userExist) {
        username = user.username;
      }
    }

    const updatedData = { username, bio, location, full_name };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    // upload profile picture
    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "512" },
        ],
      });

      updatedData.profile_picture = url;
    }

    // upload cover photo
    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });

      updatedData.cover_photo = url;
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      updatedData,
      { new: true }
    );

    res.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// discover users
export const discoverUsers = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;

    const currentUser = await User.findOne({ clerkId });

    const { input } = req.body;

    const allUsers = await User.find({
      $or: [
        { username: new RegExp(input, "i") },
        { email: new RegExp(input, "i") },
        { full_name: new RegExp(input, "i") },
        { location: new RegExp(input, "i") },
      ],
    });

    const filteredUsers = allUsers.filter(
      (u) => u._id.toString() !== currentUser._id.toString()
    );

    res.json({ success: true, users: filteredUsers });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// follow user
export const followUser = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;
    const { id } = req.body;

    const user = await User.findOne({ clerkId });

    if (user.following.includes(id)) {
      return res.json({
        success: false,
        message: "You are already following this user",
      });
    }

    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers.push(user._id);
    await toUser.save();

    res.json({ success: true, message: "Now you are following this user" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;
    const { id } = req.body;

    const user = await User.findOne({ clerkId });

    user.following = user.following.filter((u) => u.toString() !== id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter(
      (u) => u.toString() !== user._id.toString()
    );
    await toUser.save();

    res.json({
      success: true,
      message: "You are no longer following this user",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;
    const { id } = req.body;

    const user = await User.findOne({ clerkId });

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const connectionRequests = await Connection.find({
      from_user_id: user._id,
      created_at: { $gt: last24Hours },
    });

    if (connectionRequests.length >= 20) {
      return res.json({
        success: false,
        message:
          "You have sent more than 20 connection requests in the last 24 hours",
      });
    }

    const connection = await Connection.findOne({
      $or: [
        { from_user_id: user._id, to_user_id: id },
        { from_user_id: id, to_user_id: user._id },
      ],
    });

    if (!connection) {
      const newConnection = await Connection.create({
        from_user_id: user._id,
        to_user_id: id,
        status: "pending",
      });

      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });

      return res.json({
        success: true,
        message: "Connection request sent successfully",
      });
    } else if (connection.status === "accepted") {
      return res.json({
        success: false,
        message: "You are already connected with this user",
      });
    }

    return res.json({
      success: false,
      message: "Connection request pending",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get User connections
export const getUserConnections = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;
    const user = await User.findOne({ clerkId }).populate(
      "connections followers following"
    );

    const pendingConnections = (
      await Connection.find({
        to_user_id: user._id,
        status: "pending",
      }).populate("from_user_id")
    ).map((c) => c.from_user_id);

    res.json({
      success: true,
      connections: user.connections,
      followers: user.followers,
      following: user.following,
      pendingConnections,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;
    const { id } = req.body;

    const user = await User.findOne({ clerkId });

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: user._id,
    });

    if (!connection) {
      return res.json({
        success: false,
        message: "Connection not found",
      });
    }

    user.connections.push(id);
    await user.save();

    const otherUser = await User.findById(id);
    otherUser.connections.push(user._id);
    await otherUser.save();

    connection.status = "accepted";
    await connection.save();

    res.json({
      success: true,
      message: "Connection accepted successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get profile
export const getUserProfiles = async (req, res) => {
  try {
    const { profileId } = req.body;
    const profile = await User.findById(profileId);

    if (!profile) {
      return res.json({
        success: false,
        message: "Profile not found",
      });
    }

    const posts = await Post.find({ user: profileId }).populate("user");

    res.json({ success: true, profile, posts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
