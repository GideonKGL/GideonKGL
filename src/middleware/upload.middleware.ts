import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { env } from "../config/env";
import { badRequest } from "../utils/app-error";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
  "audio/wav"
]);

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
    files: 5
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(badRequest(`Unsupported file type: ${file.mimetype}`));
    }

    return callback(null, true);
  }
});
