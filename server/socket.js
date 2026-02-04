import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessageModel.js";
import Group from "./models/GroupModel.js";
import User from "./models/UserModel.js";

const setupSocket = (server) => {
  console.log("Socket.io server started");

  const io = new SocketIOServer(server, {
    cors: {
      origin: [process.env.ORIGIN],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  const userSocketMap = new Map();

  const disconnect = async (socket) => {
    console.log(`Client disconnected: ${socket.id}`);
    let disconnectedUserId = null;
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      const lastSeen = new Date();
      await User.findByIdAndUpdate(disconnectedUserId, {
        isOnline: false,
        lastSeen,
      });
      io.emit("presenceUpdate", {
        userId: disconnectedUserId,
        isOnline: false,
        lastSeen,
      });
    }
  };

  const sendMessage = async (message) => {
    console.log(userSocketMap);

    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);
    // const recipientSocketId = message.recipient;

    console.log(
      `Sending message to ${recipientSocketId} from ${senderSocketId}`
    );

    // console.log("recipient: ", message.recipient);
    // console.log("recipientId: ", recipientSocketId);

    const createdMessage = await Message.create(message);

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color");

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", messageData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }
  };

  const sendFriendRequest = async (friendRequest) => {
    // console.log(friendRequest);
    const recipientSocketId = userSocketMap.get(friendRequest.target._id);
    const senderSocketId = userSocketMap.get(friendRequest.friendRequest.id);

    console.log(
      `Sending friend request to ${recipientSocketId} from ${senderSocketId}`
    );
    if (recipientSocketId) {
      io.to(recipientSocketId).emit(
        "receiveFriendRequest",
        friendRequest.friendRequest
      );
    }
  };

  const sendGroupMessage = async (message) => {
    // console.log("inside send group message");
    const { groupId, sender, content, messageType, fileUrl } = message;
    // console.log("msg content: " + content);
    const createdMessage = await Message.create({
      sender,
      recipient: null,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
    });
    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .exec();
    // console.log("messageData: " + messageData);
    // Select only the fields you want to store in the lastMessage
    const lastMessageData = {
      content: messageData.content,
      messageType: messageData.messageType,
      timestamp: messageData.timestamp,
      fileUrl: messageData.fileUrl,
    };
    // Update the group with the new message and store only selected fields in lastMessage
    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: createdMessage._id }, // Push the message ID to the messages array
      $set: { lastMessage: lastMessageData }, // Store only selected fields in lastMessage
    });
    const group = await Group.findById(groupId).populate("members");
    const finalData = { ...messageData._doc, groupId: group._id, group: group };
    // console.log("finalData: " + finalData);
    if (group && group.members) {
      group.members.forEach((member) => {
        // console.log("member: " + member);
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("receiveGroupMessage", finalData);
        }
      });
    }
  };

  const handleDeleteMessage = async (payload) => {
    try {
      const { messageId, deleteType, chatType, groupId, requesterId } = payload;
      if (!messageId || !deleteType || !requesterId) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      if (deleteType === "forMe") {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deletedFor: requesterId },
        });
        const requesterSocketId = userSocketMap.get(requesterId);
        if (requesterSocketId) {
          io.to(requesterSocketId).emit("messageDeletedForMe", { messageId });
        }
        return;
      }

      if (deleteType === "forAll") {
        if (message.sender.toString() !== requesterId) return;
        await Message.findByIdAndDelete(messageId);

        if (chatType === "group" && groupId) {
          const group = await Group.findByIdAndUpdate(
            groupId,
            { $pull: { messages: messageId } },
            { new: true }
          );

          if (group) {
            if (group.messages?.length) {
              const lastMessageId =
                group.messages[group.messages.length - 1];
              const lastMessage = await Message.findById(lastMessageId).select(
                "content messageType timestamp fileUrl"
              );
              await Group.findByIdAndUpdate(groupId, {
                $set: { lastMessage: lastMessage || null },
              });
            } else {
              await Group.findByIdAndUpdate(groupId, {
                $set: { lastMessage: null },
              });
            }
          }

          if (group?.members?.length) {
            group.members.forEach((memberId) => {
              const memberSocketId = userSocketMap.get(memberId.toString());
              if (memberSocketId) {
                io.to(memberSocketId).emit(
                  "messageDeletedForAll",
                  { messageId }
                );
              }
            });
          }
          return;
        }

        if (chatType === "contact") {
          const senderId = message.sender.toString();
          const recipientId = message.recipient?.toString();
          [senderId, recipientId].forEach((userId) => {
            if (!userId) return;
            const socketId = userSocketMap.get(userId);
            if (socketId) {
              io.to(socketId).emit("messageDeletedForAll", { messageId });
            }
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const createGroup = async (group) => {
    console.log(group);
    if (group && group.members) {
      group.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member);
        if (memberSocketId) {
          io.to(memberSocketId).emit("receiveGroupCreation", group);
        }
      });
    }
  };

  const handleTyping = async (data) => {
    if (!data) return;
    const {
      chatType,
      senderId,
      recipientId,
      groupId,
      memberIds,
      senderName,
    } = data;

    if (chatType === "contact") {
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveTyping", {
          chatType,
          senderId,
          senderName,
        });
      }
      return;
    }

    if (chatType === "group" && Array.isArray(memberIds)) {
      memberIds.forEach((memberId) => {
        if (memberId === senderId) return;
        const memberSocketId = userSocketMap.get(memberId);
        if (memberSocketId) {
          io.to(memberSocketId).emit("receiveTyping", {
            chatType,
            senderId,
            senderName,
            groupId,
          });
        }
      });
    }
  };

  const handleStopTyping = async (data) => {
    if (!data) return;
    const {
      chatType,
      senderId,
      recipientId,
      groupId,
      memberIds,
      senderName,
    } = data;

    if (chatType === "contact") {
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveStopTyping", {
          chatType,
          senderId,
          senderName,
        });
      }
      return;
    }

    if (chatType === "group" && Array.isArray(memberIds)) {
      memberIds.forEach((memberId) => {
        if (memberId === senderId) return;
        const memberSocketId = userSocketMap.get(memberId);
        if (memberSocketId) {
          io.to(memberSocketId).emit("receiveStopTyping", {
            chatType,
            senderId,
            senderName,
            groupId,
          });
        }
      });
    }
  };

  io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected.`);
    const userId = socket.handshake.query.userId;

    if (userId) {
      socket.userId = userId;
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket id: ${socket.id}`);
      User.findByIdAndUpdate(userId, { isOnline: true })
        .then((user) => {
          io.emit("presenceUpdate", {
            userId,
            isOnline: true,
            lastSeen: user?.lastSeen || null,
          });
        })
        .catch((error) => console.log(error));
    } else {
      console.log("User ID not provided during connection.");
    }

    socket.on("sendMessage", sendMessage);
    socket.on("sendFriendRequest", sendFriendRequest);
    socket.on("sendGroupMessage", sendGroupMessage);
    socket.on("createGroup", createGroup);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("deleteMessage", handleDeleteMessage);

    socket.on("call:offer", (payload) => {
      if (!payload?.recipientId) return;
      const recipientSocketId = userSocketMap.get(payload.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call:offer", payload);
      }
    });

    socket.on("call:answer", (payload) => {
      if (!payload?.recipientId) return;
      const recipientSocketId = userSocketMap.get(payload.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call:answer", payload);
      }
    });

    socket.on("call:ice", (payload) => {
      if (!payload?.recipientId) return;
      const recipientSocketId = userSocketMap.get(payload.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call:ice", payload);
      }
    });

    socket.on("call:end", (payload) => {
      if (!payload?.recipientId) return;
      const recipientSocketId = userSocketMap.get(payload.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call:end", payload);
      }
    });

    socket.on("call:decline", (payload) => {
      if (!payload?.recipientId) return;
      const recipientSocketId = userSocketMap.get(payload.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call:decline", payload);
      }
    });

    socket.on("messagesSeen", async (payload) => {
      try {
        const readerId = socket.userId;
        const otherUserId = payload?.otherUserId;
        if (!readerId || !otherUserId) return;

        const reader = await User.findById(readerId).select(
          "readReceiptsEnabled"
        );
        if (reader?.readReceiptsEnabled === false) return;

        const readAt = new Date();
        await Message.updateMany(
          {
            sender: otherUserId,
            recipient: readerId,
            readAt: null,
          },
          { $set: { readAt } }
        );

        const senderSocketId = userSocketMap.get(otherUserId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesSeen", {
            readerId,
            readAt,
          });
        }
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;
