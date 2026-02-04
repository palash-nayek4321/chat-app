import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAppStore } from "../store";
import { HOST } from "../utils/constants";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useRef();
  const { userInfo } = useAppStore();

  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST, {
        withCredentials: true,
        query: { userId: userInfo.id },
      });
      socket.current.on("connect", () => {
        console.log("Connected to socket server");
      });

      const handleReceiveMessage = (message) => {
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          addContactsInDMContacts,
          userInfo,
        } = useAppStore.getState();

        if (
          selectedChatType !== undefined &&
          (selectedChatData._id === message.sender._id ||
            selectedChatData._id === message.recipient._id)
        ) {
          console.log("message rcvd", message);
          addMessage(message);
          if (
            socket.current &&
            selectedChatType === "contact" &&
            selectedChatData?._id === message.sender._id &&
            userInfo?.readReceiptsEnabled !== false
          ) {
            socket.current.emit("messagesSeen", {
              otherUserId: message.sender._id,
            });
          }
        }
        addContactsInDMContacts(message);
      };

      const handleReceiveGroupMessage = (message) => {
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          sortGroupList,
        } = useAppStore.getState();
        if (
          selectedChatType !== undefined &&
          selectedChatData._id === message.groupId
        ) {
          addMessage(message);
        }
        sortGroupList(message.group);
      };
      const handleReceiveGroupCreation = (group) => {
        const { addGroup } = useAppStore.getState();
        addGroup(group);
      };

      const handleReceiveFriendRequest = (friendRequest) => {
        const { friendRequests, setFriendRequests, setFriendRequestsCount } =
          useAppStore.getState();

        const formattedFriendRequest = {
          email: friendRequest.email,
          firstName: friendRequest.firstName,
          lastName: friendRequest.lastName,
          image: friendRequest.image,
        };

        // Check if the friend request already exists
        const requestExists = friendRequests.some(
          (req) => req.email === formattedFriendRequest.email
        );

        // Only add the formatted friend request if it doesn't already exist
        if (!requestExists) {
          setFriendRequestsCount(friendRequests.length + 1);
          setFriendRequests([formattedFriendRequest, ...friendRequests]);
        } else {
          console.log("Friend request already exists.");
        }
      };

      const handlePresenceUpdate = (data) => {
        if (!data) return;
        const { userId, isOnline, lastSeen } = data;
        if (!userId) return;
        const { updateContactPresence } = useAppStore.getState();
        updateContactPresence(userId, isOnline, lastSeen);
      };

      const handleMessageDeletedForAll = (payload) => {
        if (!payload) return;
        const { messageId } = payload;
        if (!messageId) return;
        const { removeMessage, setRefreshChatList } = useAppStore.getState();
        removeMessage(messageId);
        setRefreshChatList(true);
      };

      const handleMessageDeletedForMe = (payload) => {
        if (!payload) return;
        const { messageId } = payload;
        if (!messageId) return;
        const { removeMessage } = useAppStore.getState();
        removeMessage(messageId);
      };

      const handleMessagesSeen = (payload) => {
        if (!payload) return;
        const { readerId, readAt } = payload;
        if (!readerId || !readAt) return;
        const { markMessagesReadByContact } = useAppStore.getState();
        markMessagesReadByContact(readerId, readAt);
      };

      socket.current.on("receiveMessage", handleReceiveMessage);
      socket.current.on("receiveGroupCreation", handleReceiveGroupCreation);
      socket.current.on("receiveGroupMessage", handleReceiveGroupMessage);
      socket.current.on("receiveFriendRequest", handleReceiveFriendRequest);
      socket.current.on("presenceUpdate", handlePresenceUpdate);
      socket.current.on("messageDeletedForAll", handleMessageDeletedForAll);
      socket.current.on("messageDeletedForMe", handleMessageDeletedForMe);
      socket.current.on("messagesSeen", handleMessagesSeen);

      return () => {
        socket.current.disconnect();
      };
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
