import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

export const uploadFile = async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: "No file provided" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "webchat",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.log(error);
          return response.status(500).json({ error: "Upload failed" });
        }
        return response.status(200).json({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(request.file.buffer);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};
