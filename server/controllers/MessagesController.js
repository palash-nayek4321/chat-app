import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";

export const getMessages = async (request, response, next) => {
  try {
    const user1 = request.userId;
    const user2 = request.body.id;

    if (!user1 || !user2) {
      return response.status(400).json({ error: "Both user IDs are required" });
    }

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { sender: user1, recipient: user2 },
            { sender: user2, recipient: user1 },
          ],
        },
        { deletedFor: { $nin: [user1] } },
      ],
    }).sort({ timestamp: 1 });

    return response.status(200).json({ messages });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};
