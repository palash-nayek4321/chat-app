import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { uploadFile, uploadMiddleware } from "../controllers/UploadController.js";

const uploadRoutes = Router();

uploadRoutes.post("/upload", verifyToken, uploadMiddleware, uploadFile);

export default uploadRoutes;
