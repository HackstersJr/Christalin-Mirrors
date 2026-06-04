import multer from 'multer';
import { cloudinary } from '../config/cloudinary';
import { Request } from 'express';
import { Readable } from 'stream';

// Memory storage – never saves to disk, streams directly to Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/** Stream a multer file buffer directly to Cloudinary */
export function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `christalin-mirrors/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    const readStream = Readable.from(file.buffer);
    readStream.pipe(uploadStream);
  });
}
