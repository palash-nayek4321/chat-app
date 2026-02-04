import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import {
  createStatus,
  deleteStatus,
  getMyStatuses,
  getStatusFeed,
} from "../controllers/StatusController.js";

const statusRoutes = Router();

statusRoutes.post("/create", verifyToken, createStatus);
statusRoutes.get("/mine", verifyToken, getMyStatuses);
statusRoutes.get("/feed", verifyToken, getStatusFeed);
statusRoutes.delete("/:statusId", verifyToken, deleteStatus);

export default statusRoutes;
