import multer from "multer";

// Use disk storage (files saved temporarily before uploading to ImageKit)
const storage = multer.diskStorage({});

// File size limit (optional but recommended)
const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB
};

// File filter (optional) — accepts only images
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP images are allowed."), false);
  }
};

export const upload = multer({
  storage,
  limits,
  fileFilter,
});
