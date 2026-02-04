import Status from "../models/StatusModel.js";
import User from "../models/UserModel.js";

const STATUS_TTL_MS = 24 * 60 * 60 * 1000;

export const createStatus = async (request, response) => {
  try {
    const userId = request.userId;
    const { text, imageUrl } = request.body;

    if (!text || !imageUrl) {
      return response
        .status(400)
        .json({ error: "Both text and image are required" });
    }

    const expiresAt = new Date(Date.now() + STATUS_TTL_MS);
    const status = await Status.create({
      owner: userId,
      text,
      imageUrl,
      expiresAt,
    });

    return response.status(201).json({ status });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const getMyStatuses = async (request, response) => {
  try {
    const userId = request.userId;
    const now = new Date();

    const statuses = await Status.find({
      owner: userId,
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 });

    return response.status(200).json({ statuses });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const getStatusFeed = async (request, response) => {
  try {
    const userId = request.userId;
    const now = new Date();

    const currentUser = await User.findById(userId).select("friends");
    if (!currentUser) {
      return response.status(404).json({ error: "User not found" });
    }

    const friendsEmails = currentUser.friends || [];
    const friends = await User.find({ email: { $in: friendsEmails } }).select(
      "_id"
    );

    const friendIds = friends.map((friend) => friend._id);

    const statuses = await Status.find({
      owner: { $in: friendIds },
      expiresAt: { $gt: now },
    })
      .populate("owner", "firstName lastName image email")
      .sort({ createdAt: -1 });

    return response.status(200).json({ statuses });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const deleteStatus = async (request, response) => {
  try {
    const userId = request.userId;
    const { statusId } = request.params;

    const status = await Status.findById(statusId);
    if (!status) {
      return response.status(404).json({ error: "Status not found" });
    }

    if (status.owner.toString() !== userId) {
      return response.status(403).json({ error: "Not allowed" });
    }

    await Status.findByIdAndDelete(statusId);
    return response.status(200).json({ message: "Status deleted" });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};
