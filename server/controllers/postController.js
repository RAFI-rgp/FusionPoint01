import fs from "fs";
import imagekit from "../configs/imagekit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

// Add Post
export const addPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { content } = req.body;
    const images = req.files;

    let image_urls = [];

    if (images && images.length > 0) {
      image_urls = await Promise.all(
        images.map(async (img) => {
          const buffer = fs.readFileSync(img.path);

          const uploadRes = await imagekit.upload({
            file: buffer,
            fileName: img.originalname,
            folder: "posts",
          });

          const url = imagekit.url({
            path: uploadRes.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });

          return url;
        })
      );
    }

    const post_type =
      image_urls.length > 0 && content
        ? "text_with_image"
        : image_urls.length > 0
        ? "image"
        : "text";

    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });

    res.json({ success: true, message: "Post created successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get Feed Posts
export const getFeedPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    const userIds = [userId, ...user.connections, ...user.following];

    const posts = await Post.find({ user: { $in: userIds } })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Like Post
export const likePost = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.body;

    const post = await Post.findById(postId);

    if (!post)
      return res.json({ success: false, message: "Post not found" });

    if (post.likes_count.includes(userId)) {
      post.likes_count.pull(userId);
      await post.save();
      res.json({ success: true, message: "Post unliked" });
    } else {
      post.likes_count.push(userId);
      await post.save();
      res.json({ success: true, message: "Post liked" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
