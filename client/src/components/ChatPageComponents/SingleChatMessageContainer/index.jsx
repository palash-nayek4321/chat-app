import { useEffect, useRef, useState } from "react";
import "./SingleChatMessageContainer.css";
import { useAppStore } from "../../../store";
import { apiClient } from "../../../lib/api-client";
import {
  GET_ALL_MESSAGES_ROUTE,
  GET_GROUP_MESSAGES_ROUTE,
} from "../../../utils/constants";
import moment from "moment";
import { MdChatBubble } from "react-icons/md";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { PiClockFill } from "react-icons/pi";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoCheckmark } from "react-icons/io5";
import { getColor } from "../../../lib/group-member-color";
import ScrollToBottom from "../ScrollToBottom/scrollToBottom";
import { useSocket } from "../../../context/SocketContext";

const SingleChatMessageContainer = () => {
  const messageContainerRef = useRef();
  const scrollRef = useRef();
  const scrollProgressRef = useRef();
  const placeholderMessageRef = useRef();
  const socket = useSocket();
  const isAtBottomRef = useRef(true);

  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
    selectedChatMembers,
    setSelectedChatMembers,
    uploadProgress,
    setUploadProgress,
    uploadTargetId,
    setUploadTargetId,
    uploadFileName,
    setUploadFileName,
    placeholderMessage,
    setPlaceholderMessage,
    showFileUploadPlaceholder,
    setShowFileUploadPlaceholder,
    chatSearchTerm,
    updateMessage,
    removeMessage,
  } = useAppStore();

  const filterDeletedForUser = (messages) => {
    if (!Array.isArray(messages)) return [];
    const userId = userInfo?.id;
    if (!userId) return messages;
    return messages.filter((message) => {
      if (!Array.isArray(message?.deletedFor)) return true;
      return !message.deletedFor.some(
        (id) => id?.toString && id.toString() === userId
      );
    });
  };

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTE,
          { id: selectedChatData._id },
          { withCredentials: true }
        );

        if (response.data.messages) {
          setSelectedChatMessages(filterDeletedForUser(response.data.messages));
        }
      } catch (error) {
        console.log(error);
      }
    };

    const getGroupMessages = async () => {
      try {
        const response = await apiClient.get(
          `${GET_GROUP_MESSAGES_ROUTE}/${selectedChatData._id}`,
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(filterDeletedForUser(response.data.messages));
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
      else if (selectedChatType === "group") {
        getGroupMessages();
      }
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);

  // useEffect(() => {
  //   if (scrollRef.current) {
  //     scrollRef.current.scrollIntoView({ behavior: "instant" });
  //   }
  // }, []);

  // useEffect(() => {
  //   if (scrollRef.current) {
  //     scrollRef.current.scrollIntoView({ behavior: "auto" });
  //     // scrollRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [selectedChatData]);
  const checkIsAtBottom = () => {
    const container = messageContainerRef.current;
    if (!container) return true;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < 80;
  };

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isAtBottomRef.current = checkIsAtBottom();
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToBottom = (behavior = "auto") => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [selectedChatMessages]);

  useEffect(() => {
    if (
      !socket ||
      selectedChatType !== "contact" ||
      !selectedChatData?._id ||
      userInfo?.readReceiptsEnabled === false
    ) {
      return;
    }

    socket.emit("messagesSeen", {
      otherUserId: selectedChatData._id,
    });
  }, [
    socket,
    selectedChatType,
    selectedChatData?._id,
    selectedChatMessages,
    userInfo?.readReceiptsEnabled,
  ]);
  useEffect(() => {
    if (isAtBottomRef.current) {
      if (scrollProgressRef.current) {
        scrollProgressRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
    // }, [showFileUploadPlaceholder]);
  }, [uploadProgress]);
  useEffect(() => {
    if (isAtBottomRef.current) {
      if (placeholderMessageRef.current) {
        placeholderMessageRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [placeholderMessage]);

  const [showImage, setShowImage] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [openDeleteMenuId, setOpenDeleteMenuId] = useState(null);

  useEffect(() => {
    setTypingUsers([]);
  }, [selectedChatData, selectedChatType]);

  useEffect(() => {
    setOpenDeleteMenuId(null);
  }, [selectedChatData?._id, selectedChatType]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveTyping = (data) => {
      if (!data) return;
      const { chatType, senderId, senderName, groupId } = data;
      if (!senderId || senderId === userInfo.id) return;

      if (selectedChatType === "contact") {
        if (chatType !== "contact") return;
        if (selectedChatData?._id !== senderId) return;
        setTypingUsers([{ id: senderId, name: senderName }]);
      }

      if (selectedChatType === "group") {
        if (chatType !== "group") return;
        if (selectedChatData?._id !== groupId) return;
        setTypingUsers((prev) => {
          if (prev.some((user) => user.id === senderId)) return prev;
          return [...prev, { id: senderId, name: senderName }];
        });
      }
    };

    const handleReceiveStopTyping = (data) => {
      if (!data) return;
      const { chatType, senderId, groupId } = data;
      if (!senderId || senderId === userInfo.id) return;

      if (selectedChatType === "contact") {
        if (chatType !== "contact") return;
        if (selectedChatData?._id !== senderId) return;
        setTypingUsers([]);
      }

      if (selectedChatType === "group") {
        if (chatType !== "group") return;
        if (selectedChatData?._id !== groupId) return;
        setTypingUsers((prev) => prev.filter((user) => user.id !== senderId));
      }
    };

    socket.on("receiveTyping", handleReceiveTyping);
    socket.on("receiveStopTyping", handleReceiveStopTyping);

    return () => {
      socket.off("receiveTyping", handleReceiveTyping);
      socket.off("receiveStopTyping", handleReceiveStopTyping);
    };
  }, [socket, selectedChatType, selectedChatData?._id, userInfo.id]);

  useEffect(() => {
    if (selectedChatData?._id) {
      requestAnimationFrame(() => scrollToBottom("auto"));
    }
  }, [selectedChatData?._id, selectedChatType]);

  const checkIfImage = (filePath) => {
    // Extract the part before the query parameters
    const pathWithoutParams = filePath.split("?")[0];

    // Define regex to check if it ends with a valid image extension
    const imageRegex =
      /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif|jfif)$/i;

    // Test the cleaned path
    return imageRegex.test(pathWithoutParams);
  };

  const checkIfAudio = (filePath) => {
    const pathWithoutParams = filePath.split("?")[0];
    const audioRegex = /\.(mp3|wav|ogg|m4a|aac|webm)$/i;
    return audioRegex.test(pathWithoutParams);
  };

  const normalizedSearchTerm = (chatSearchTerm || "").trim().toLowerCase();
  const messagesToRender = normalizedSearchTerm
    ? selectedChatMessages.filter(
        (message) =>
          message.messageType === "text" &&
          typeof message.content === "string" &&
          message.content.toLowerCase().includes(normalizedSearchTerm)
      )
    : selectedChatMessages;

  const renderHighlightedText = (text) => {
    if (!normalizedSearchTerm) return text;
    const lowerText = text.toLowerCase();
    const matchIndex = lowerText.indexOf(normalizedSearchTerm);
    if (matchIndex === -1) return text;

    const before = text.slice(0, matchIndex);
    const match = text.slice(matchIndex, matchIndex + normalizedSearchTerm.length);
    const after = text.slice(matchIndex + normalizedSearchTerm.length);

    return (
      <>
        {before}
        <span className="search-highlight">{match}</span>
        {after}
      </>
    );
  };

  const renderMessages = () => {
    if (normalizedSearchTerm && messagesToRender.length === 0) {
      return (
        <div className="no-search-results">No matching messages found.</div>
      );
    }

    let lastDate = null;
    return messagesToRender.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");

      const showDate = messageDate !== lastDate;

      const isMessageDateToday =
        moment(Date.now()).format("YYYY-MM-DD") ===
        moment(message.timestamp).format("YYYY-MM-DD");
      const isMessageDateYesterday =
        moment(Date.now()).subtract(1, "days").format("YYYY-MM-DD") ===
        moment(message.timestamp).format("YYYY-MM-DD");
      const isMessageDateThisWeekExceptTodayAndYesterday =
        moment(Date.now()).subtract(2, "days").format("YYYY-MM-DD") ===
          moment(message.timestamp).format("YYYY-MM-DD") ||
        moment(Date.now()).subtract(3, "days").format("YYYY-MM-DD") ===
          moment(message.timestamp).format("YYYY-MM-DD") ||
        moment(Date.now()).subtract(4, "days").format("YYYY-MM-DD") ===
          moment(message.timestamp).format("YYYY-MM-DD") ||
        moment(Date.now()).subtract(5, "days").format("YYYY-MM-DD") ===
          moment(message.timestamp).format("YYYY-MM-DD") ||
        moment(Date.now()).subtract(6, "days").format("YYYY-MM-DD") ===
          moment(message.timestamp).format("YYYY-MM-DD");

      lastDate = messageDate;

      // console.log("showDate: " + showDate);

      return (
        <div key={index}>
          {showDate && (
            <div className="general-date-container">
              <div className="general-date-line left"></div>
              <div className="general-date">
                {isMessageDateToday
                  ? "Today"
                  : isMessageDateYesterday
                  ? "Yesterday"
                  : isMessageDateThisWeekExceptTodayAndYesterday
                  ? moment(message.timestamp).format("dddd")
                  : moment(message.timestamp).format("L")}
              </div>
              <div className="general-date-line right"></div>
            </div>
          )}
          {selectedChatType === "contact" && renderDMMessages(message)}
          {selectedChatType === "group" && renderGroupMessages(message)}
        </div>
      );
    });
  };

  const handleDownload = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", ""); // This forces a download -> Downloads with the original filename from the URL
    // link.setAttribute("download", "myFileName.extension"); // Downloads as "myImage.jpg" for example
    document.body.appendChild(link);
    link.click();
    // link.remove(); redundant -> below line already does the same thing
    document.body.removeChild(link);
  };

  const shortenFileName = (fileName, maxLength = 81) => {
    if (fileName.length <= maxLength) {
      return fileName; // No need to shorten
    }

    const startLength = 24; // Length of the start part
    const endLength = 24; // Length of the end part

    const start = fileName.slice(0, startLength); // First 24 characters
    const end = fileName.slice(-endLength); // Last 24 characters

    const totalLength = fileName.length; // Total length of the original file name
    const dotsCount = totalLength - startLength - endLength; // Calculate number of dots

    // Create dots string based on calculated number
    const dots = dotsCount > 0 ? ".".repeat(dotsCount) : "";

    return `${start}${dots}${end}`;
  };

  const getFileNameFromUrl = (fileName, maxLength = 81) => {
    if (!fileName) return "";

    // Find the last closing parenthesis ")"
    const lastClosingParenIndex = fileName.lastIndexOf(")");

    // Extract the file name part after the last closing parenthesis
    const cleanFileName =
      lastClosingParenIndex !== -1
        ? fileName.substring(lastClosingParenIndex + 1).trim()
        : fileName; // If no closing parenthesis, return the original file name

    return cleanFileName.length > maxLength
      ? cleanFileName.substring(0, maxLength) + "..."
      : cleanFileName;
  };

  const renderDMMessages = (message) => (
    <div
      className={`message ${
        message.sender === selectedChatData._id
          ? "contact-message"
          : "own-message"
      }`}
    >
      <div
        className={`${
          message.sender !== selectedChatData._id
            ? "own-message-content"
            : "contact-message-content"
        } message-content ${message.deletedForAll ? "message-deleted" : ""}`}
      >
        <div className="message-actions">
          <button
            type="button"
            className="message-action-button"
            onClick={() =>
              setOpenDeleteMenuId((prev) =>
                prev === message._id ? null : message._id
              )
            }
            aria-label="Message actions"
          >
            <RiDeleteBinLine />
          </button>
          {openDeleteMenuId === message._id && (
            <div className="message-action-menu">
              <button
                type="button"
                onClick={() => {
                  if (!socket) return;
                  socket.emit("deleteMessage", {
                    messageId: message._id,
                    deleteType: "forMe",
                    chatType: "contact",
                    requesterId: userInfo.id,
                  });
                  setOpenDeleteMenuId(null);
                  removeMessage(message._id);
                }}
              >
                Delete for me
              </button>
              {message.sender !== selectedChatData._id &&
                !message.deletedForAll && (
              <button
                type="button"
                onClick={() => {
                  if (!socket) return;
                  socket.emit("deleteMessage", {
                    messageId: message._id,
                    deleteType: "forAll",
                    chatType: "contact",
                    requesterId: userInfo.id,
                  });
                  setOpenDeleteMenuId(null);
                  removeMessage(message._id);
                }}
              >
                Delete for all
              </button>
                )}
            </div>
          )}
        </div>
        <div className="user-pointer">
          <MdChatBubble className="user-pointer-icon" />
        </div>
        {message.messageType === "text" &&
          renderHighlightedText(message.content)}
        {message.messageType === "file" && message.fileUrl && (
          <div>
            {checkIfImage(message.fileUrl) ? (
              <div
                className="image-container"
                onClick={() => {
                  setShowImage(true);
                  setImageURL(message.fileUrl);
                }}
              >
                <img
                  src={message.fileUrl}
                  alt=""
                  style={{
                    width: "12.5rem",
                    height: "12.5rem",
                    // objectFit: "contain",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              </div>
            ) : checkIfAudio(message.fileUrl) ? (
              <div className="audio-container">
                <audio controls src={message.fileUrl} />
              </div>
            ) : (
              <div className="file-container">
                <div className="file-icon-container">
                  <MdFolderZip className="file-icon" />
                </div>
                <div className="file-name">
                  {getFileNameFromUrl(
                    message.fileUrl.split("?")[0].split("/").pop()
                  )}
                </div>
                <div className="download-icon-container-link">
                  <a
                    className="download-icon-container"
                    onClick={() => handleDownload(message.fileUrl)}
                  >
                    <IoMdArrowRoundDown className="download-icon" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
        <div
          className={`${
            message.messageType === "file" && checkIfImage(message.fileUrl)
              ? "image-timestamp"
              : message.messageType === "file" && !checkIfImage(message.fileUrl)
              ? "file-timestamp"
              : ""
          } timestamp-container`}
        >
          <div className="message-timestamp">
            {moment(message.timestamp).format("LT")}
          </div>
          {message.sender !== selectedChatData._id && (
            <div
              className={`message-read-status ${
                message.readAt ? "seen" : "sent"
              }`}
            >
              {message.readAt ? (
                <span className="double-check">
                  <IoCheckmark />
                  <IoCheckmark />
                </span>
              ) : (
                <IoCheckmark />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const renderGroupMessages = (message) => (
    <div
      className={`message group-message ${
        message.sender._id === userInfo.id ? "own-message" : "contact-message"
      }`}
    >
      {/* {console.log("selectedChatData")}
      {console.log(selectedChatData)} */}
      {message.sender._id === userInfo.id ? null : (
        <div className="contact-avatar">
          {message.sender.image ? (
            <div className="avatar">
              <img src={message.sender.image} alt="" />
            </div>
          ) : (
            <div className="no-avatar" style={{ color: "#53a6fd" }}>
              {message.sender.firstName && message.sender.lastName
                ? `${message.sender.firstName.charAt(
                    0
                  )} ${message.sender.lastName.charAt(0)}`
                : message.sender.firstName
                ? message.sender.firstName.charAt(0)
                : message.sender.lastName
                ? message.sender.lastName.charAt(0)
                : message.sender.email.charAt(0)}
            </div>
          )}
        </div>
      )}
      <div
        className={`${
          message.sender._id === userInfo.id
            ? "own-message-content"
            : "contact-message-content"
        } message-content ${message.deletedForAll ? "message-deleted" : ""}`}
      >
        <div className="message-actions">
          <button
            type="button"
            className="message-action-button"
            onClick={() =>
              setOpenDeleteMenuId((prev) =>
                prev === message._id ? null : message._id
              )
            }
            aria-label="Message actions"
          >
            <RiDeleteBinLine />
          </button>
          {openDeleteMenuId === message._id && (
            <div className="message-action-menu">
              <button
                type="button"
                onClick={() => {
                  if (!socket) return;
                  socket.emit("deleteMessage", {
                    messageId: message._id,
                    deleteType: "forMe",
                    chatType: "group",
                    groupId: selectedChatData._id,
                    requesterId: userInfo.id,
                  });
                  setOpenDeleteMenuId(null);
                  removeMessage(message._id);
                }}
              >
                Delete for me
              </button>
              {message.sender._id === userInfo.id && !message.deletedForAll && (
                <button
                  type="button"
                  onClick={() => {
                    if (!socket) return;
                    socket.emit("deleteMessage", {
                      messageId: message._id,
                      deleteType: "forAll",
                      chatType: "group",
                      groupId: selectedChatData._id,
                      requesterId: userInfo.id,
                    });
                    setOpenDeleteMenuId(null);
                    removeMessage(message._id);
                  }}
                >
                  Delete for all
                </button>
              )}
            </div>
          )}
        </div>
        <div className="user-pointer">
          <MdChatBubble className="user-pointer-icon" />
        </div>
        {message.sender._id !== userInfo.id && (
          <div className="group-message-contact-info-above-content">
            <div
              className="contact-info"
              style={{ color: "#53a6fd" }}
            >{`${message.sender.firstName} ${message.sender.lastName}`}</div>
          </div>
        )}
        {message.messageType === "text" &&
          renderHighlightedText(message.content)}
        {message.messageType === "file" && message.fileUrl && (
          <div>
            {checkIfImage(message.fileUrl) ? (
              <div
                className="image-container"
                onClick={() => {
                  setShowImage(true);
                  setImageURL(message.fileUrl);
                }}
              >
                <img
                  src={message.fileUrl}
                  alt=""
                  style={{
                    width: "12.5rem",
                    height: "12.5rem",
                    // objectFit: "contain",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              </div>
            ) : checkIfAudio(message.fileUrl) ? (
              <div className="audio-container">
                <audio controls src={message.fileUrl} />
              </div>
            ) : (
              <div className="file-container">
                <div className="file-icon-container">
                  <MdFolderZip className="file-icon" />
                </div>
                <div className="file-name">
                  {getFileNameFromUrl(
                    message.fileUrl.split("?")[0].split("/").pop()
                  )}
                </div>
                <div className="download-icon-container-link">
                  <a
                    className="download-icon-container"
                    onClick={() => handleDownload(message.fileUrl)}
                  >
                    <IoMdArrowRoundDown className="download-icon" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
        <div
          className={`${
            message.messageType === "file" && checkIfImage(message.fileUrl)
              ? "image-timestamp"
              : message.messageType === "file" && !checkIfImage(message.fileUrl)
              ? "file-timestamp"
              : ""
          } timestamp-container`}
        >
          <div className="message-timestamp">
            {moment(message.timestamp).format("LT")}
          </div>
        </div>
      </div>
    </div>
  );

  const getTypingText = () => {
    if (selectedChatType === "contact") return "Typing...";
    if (!typingUsers.length) return "";

    const names = typingUsers
      .map((user) => user.name)
      .filter(Boolean);

    if (names.length === 0) return "Someone is typing...";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]}, ${names[1]} and ${
      names.length - 2
    } others are typing...`;
  };

  return (
    <div className="message-container" ref={messageContainerRef}>
      {/* {selectedChatMessages.length > 0 ? ( */}
      {renderMessages()}
      {/* ) : (
        <div className="loading-chat-messages-container">
          Loading Messages...
        </div>
      )} */}
      {/* {showFileUploadPlaceholder && uploadTargetId === selectedChatData._id && ( */}
      {uploadProgress > 0 && uploadTargetId === selectedChatData._id && (
        <>
          <div className="message own-message">
            <div className="message-content own-message-content">
              <div className="user-pointer">
                <MdChatBubble className="user-pointer-icon" />
              </div>
              <div>
                <div className="file-container">
                  <div className="file-icon-container">
                    <MdFolderZip className="file-icon" />
                  </div>
                  <div className="file-name">
                    {`Uploading "${shortenFileName(
                      uploadFileName
                    )}": ${uploadProgress.toFixed(2)}%`}
                  </div>
                  <div className="download-icon-container-link">
                    <a
                      className="download-icon-container"
                      style={{ pointerEvents: "none" }}
                    >
                      <IoMdArrowRoundDown className="download-icon" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="timestamp-container file-timestamp">
                <div className="message-timestamp">
                  {/* {moment(message.timestamp).format("LT")} */}
                  {moment(Date.now()).format("LT")}
                </div>
              </div>
            </div>
          </div>
          {/* <div ref={scrollProgressRef} /> */}
          {/* <div ref={scrollRef} /> */}
        </>
      )}
      {/* {console.log("placeholderMessage:")}
      {console.log(placeholderMessage)} */}
      {placeholderMessage !== undefined && (
        // placeholderMessage !== null &&
        // placeholderMessage !== "" &&
        <>
          <div className="message own-message">
            <div className="message-content own-message-content">
              <div className="user-pointer">
                <MdChatBubble className="user-pointer-icon" />
              </div>
              {placeholderMessage}
              <div className="timestamp-container">
                <div className="message-timestamp">
                  {/* {moment(placeholderMessage.timestamp).format("LT")} */}
                  <PiClockFill />
                </div>
              </div>
            </div>
          </div>
          {/* <div ref={placeholderMessageRef} /> */}
        </>
      )}
      {typingUsers.length > 0 && (
        <div className="message contact-message typing-indicator">
          <div className="message-content contact-message-content typing-content">
            <div className="user-pointer">
              <MdChatBubble className="user-pointer-icon" />
            </div>
            <span className="typing-text">{getTypingText()}</span>
            <span className="typing-dots" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        </div>
      )}
      <div className="scroll-ref scroll-progress-ref" ref={scrollProgressRef} />
      <div
        className="scroll-ref placeholder-message-ref"
        ref={placeholderMessageRef}
      />
      <ScrollToBottom
        containerRef={messageContainerRef}
        targetRef={scrollRef}
      />
      <div className="scroll-ref" ref={scrollRef} />
    </div>
  );
};

export default SingleChatMessageContainer;
