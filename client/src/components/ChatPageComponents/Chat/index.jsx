import "./Chat.css";
import { HiUserGroup } from "react-icons/hi";
import { MdFolderZip } from "react-icons/md";

import moment from "moment";
import { useAppStore } from "../../../store";

const Chat = ({ contact, isGroup = false, isActive = false }) => {
  const { userInfo } = useAppStore();
  const seenLabel = contact?.lastMessageReadAt
    ? `Seen \u2714\u2714 ${moment(contact.lastMessageReadAt).fromNow()}`
    : "";
  const getFileExtensionFromUrl = (url) => {
    if (!url) return "";

    // Remove query parameters if they exist
    const pathWithoutParams = url.split("?")[0];

    // Get the file name part (last part after "/")
    const fileName = pathWithoutParams.split("/").pop();

    // Extract the extension (part after the last ".")
    const extension = fileName.includes(".") ? fileName.split(".").pop() : "";

    return `${extension} file`;
  };

  const shortenLastMessage = (message) => {
    return message.length > 60 ? `${message.slice(0, 57)}...` : message;
  };

  return (
    <div className={`chat ${isActive ? "active-chat" : ""}`}>
      {!isGroup && (
        <div className="chat-header-info-avatar">
          {contact.image ? (
            <img src={contact.image} alt="avatar" className="img" />
          ) : (
            <div className="img non-present">
              {contact.firstName && contact.lastName
                ? `${contact.firstName.charAt(0)} ${contact.lastName.charAt(0)}`
                : contact.firstName
                ? contact.firstName.charAt(0)
                : contact.lastName
                ? contact.lastName.charAt(0)
                : contact.email.charAt(0)}
            </div>
          )}
        </div>
      )}
      {isGroup && (
        <div className="chat-header-info-avatar">
          <div className="group-img">
            <HiUserGroup />
          </div>
        </div>
      )}
      {isGroup ? (
        <div className="chat-info">
          <div className="chat-info-head">
            {contact.name}
            <div className="date">
              {contact.lastMessage?.timestamp &&
              moment(Date.now()).format("YYYY-MM-DD") ===
                moment(contact.lastMessage?.timestamp).format("YYYY-MM-DD")
                ? moment(contact.lastMessage?.timestamp).format("LT")
                : moment(Date.now())
                    .subtract(1, "days")
                    .format("YYYY-MM-DD") ===
                  moment(contact.lastMessage?.timestamp).format("YYYY-MM-DD")
                ? "Yesterday"
                : moment(Date.now())
                    .subtract(2, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessage?.timestamp).format(
                      "YYYY-MM-DD"
                    ) ||
                  moment(Date.now())
                    .subtract(3, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessage?.timestamp).format(
                      "YYYY-MM-DD"
                    ) ||
                  moment(Date.now())
                    .subtract(4, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessage?.timestamp).format(
                      "YYYY-MM-DD"
                    ) ||
                  moment(Date.now())
                    .subtract(5, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessage?.timestamp).format(
                      "YYYY-MM-DD"
                    ) ||
                  moment(Date.now())
                    .subtract(6, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessage?.timestamp).format("YYYY-MM-DD")
                ? moment(contact.lastMessage?.timestamp).format("dddd")
                : moment(contact.lastMessage?.timestamp).format("L")}
            </div>
          </div>
          <div className={`last-message ${isActive ? "active-chat" : ""}`}>
            {contact.lastMessage?.messageType === "file" && (
              <MdFolderZip className="last-message-file" />
            )}
            {contact.lastMessage?.messageType === "text"
              ? `${shortenLastMessage(contact.lastMessage?.content)}`
              : `${getFileExtensionFromUrl(contact.lastMessage?.fileUrl)}`}
          </div>
        </div>
      ) : (
        <div className="chat-info">
          <div className="chat-info-head">
            {contact.firstName && contact.lastName
              ? `${contact.firstName} ${contact.lastName}`
              : contact.firstName
              ? contact.firstName
              : contact.lastName
              ? contact.lastName
              : contact.email}

            <div className="date">
              {contact.lastMessageTime &&
              moment(Date.now()).format("YYYY-MM-DD") ===
                moment(contact.lastMessageTime).format("YYYY-MM-DD")
                ? moment(contact.lastMessageTime).format("LT")
                : moment(Date.now())
                    .subtract(1, "days")
                    .format("YYYY-MM-DD") ===
                  moment(contact.lastMessageTime).format("YYYY-MM-DD")
                ? "Yesterday"
                : moment(Date.now())
                    .subtract(2, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessageTime).format("YYYY-MM-DD") ||
                  moment(Date.now())
                    .subtract(3, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessageTime).format("YYYY-MM-DD") ||
                  moment(Date.now())
                    .subtract(4, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessageTime).format("YYYY-MM-DD") ||
                  moment(Date.now())
                    .subtract(5, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessageTime).format("YYYY-MM-DD") ||
                  moment(Date.now())
                    .subtract(6, "days")
                    .format("YYYY-MM-DD") ===
                    moment(contact.lastMessageTime).format("YYYY-MM-DD")
                ? moment(contact.lastMessageTime).format("dddd")
                : moment(contact.lastMessageTime).format("L")}
            </div>
          </div>
          <div className={`last-message ${isActive ? "active-chat" : ""}`}>
            {contact.lastMessageType === "file" && (
              <MdFolderZip className="last-message-file" />
            )}
            {contact.lastMessageType === "text"
              ? `${shortenLastMessage(contact.lastMessage)}`
              : `${getFileExtensionFromUrl(contact.lastMessage)}`}
          </div>
          {userInfo?.readReceiptsEnabled !== false &&
            contact.lastMessageSender?.toString?.() === userInfo.id && (
              <div
                className={`seen-status ${
                  contact.lastMessageReadAt ? "visible" : "hidden"
                }`}
                aria-hidden={!contact.lastMessageReadAt}
              >
                {seenLabel || "Seen \u2714\u2714"}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Chat;
