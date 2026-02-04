import { Router } from "express";

import {
  createFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  searchFriendRequests,
} from "../controllers/FriendRequestsControllers.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const friendRequestsRoutes = Router();

friendRequestsRoutes.post(
  "/create-friend-request",
  verifyToken,
  createFriendRequest
);
friendRequestsRoutes.get(
  "/get-friend-requests",
  verifyToken,
  getFriendRequests
);
friendRequestsRoutes.put(
  "/reject-friend-request",
  verifyToken,
  rejectFriendRequest
);
friendRequestsRoutes.put(
  "/accept-friend-request",
  verifyToken,
  acceptFriendRequest
);
friendRequestsRoutes.post(
  "/search-friend-requests",
  verifyToken,
  searchFriendRequests
);

export default friendRequestsRoutes;
