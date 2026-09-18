import multer from "multer";

// uploads stay in MEMORY
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2 MB
});
