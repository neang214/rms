import multer from "multer";
import path from "path";
import fs from "fs";

// Resolve uploads/ to an absolute path so it's the same folder no matter
// which directory the server was started from.
const uploadDir = path.join(process.cwd(), "uploads");

// Create the folder on startup if it doesn't exist yet — multer won't
// create it automatically and would otherwise throw ENOENT on first upload.
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // `prefix` lets each module label its files (menu-, stock-, ...).
    // Falls back to "img" when a route doesn't set one.
    const prefix = req.uploadPrefix || "img";
    cb(null, `${prefix}-${req.params.id}-${Date.now()}${ext}`);
  },
});

// Only accept real images, and cap the size so an admin can't fill the disk.
const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files (jpeg, png, webp, gif) are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Tiny helper: mark which prefix the saved file should use.
// Usage: router.post("/:id/image", setUploadPrefix("stock"), upload.single("image"), ...)
export const setUploadPrefix = (prefix) => (req, res, next) => {
  req.uploadPrefix = prefix;
  next();
};
