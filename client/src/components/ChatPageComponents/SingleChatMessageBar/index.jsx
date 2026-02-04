import { RiEmojiStickerLine } from "react-icons/ri";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { MdMic, MdStop } from "react-icons/md";
import { toast } from "react-toastify";

import "./SingleChatMessageBar.css";
import { useAppStore } from "../../../store";
import { useSocket } from "../../../context/SocketContext";
import upload from "../../../lib/upload";

const SingleChatMessageBar = () => {
  const emojiRef = useRef();

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const socket = useSocket();

  const {
    selectedChatType,
    selectedChatData,
    selectedChatMembers,
    userInfo,
    setRefreshChatList,
    setActiveChatId,
    setPlaceholderMessage,
    setShowFileUploadPlaceholder,
  } = useAppStore();

  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const lastTypingPayloadRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddEmoji = (emoji) => {
    setMessage((current) => current + emoji.emoji);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };


  const messageInputRef = useRef();

  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedChatData]);

  const getSenderName = () => {
    if (!userInfo) return "Someone";
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`;
    }
    if (userInfo.firstName) return userInfo.firstName;
    if (userInfo.lastName) return userInfo.lastName;
    return userInfo.email || "Someone";
  };

  const buildTypingPayload = () => {
    if (!socket || !selectedChatData?._id || !userInfo?.id) return null;
    const senderName = getSenderName();

    if (selectedChatType === "contact") {
      return {
        chatType: "contact",
        senderId: userInfo.id,
        recipientId: selectedChatData._id,
        senderName,
      };
    }

    if (selectedChatType === "group") {
      const memberIds = (selectedChatMembers || [])
        .map((member) => member.id)
        .filter(Boolean);

      return {
        chatType: "group",
        senderId: userInfo.id,
        groupId: selectedChatData._id,
        senderName,
        memberIds,
      };
    }

    return null;
  };

  const stopTypingNow = () => {
    const payload = lastTypingPayloadRef.current || buildTypingPayload();
    if (payload && socket) {
      socket.emit("stopTyping", payload);
    }
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleTyping = (nextValue) => {
    if (!nextValue || !nextValue.trim()) {
      if (isTypingRef.current) stopTypingNow();
      return;
    }

    const payload = buildTypingPayload();
    if (!payload) return;
    lastTypingPayloadRef.current = payload;

    if (!isTypingRef.current) {
      socket.emit("typing", payload);
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit("stopTyping", payload);
        isTypingRef.current = false;
      }
    }, 1200);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // console.log(message);
    if (selectedChatType === "contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
    } else if (selectedChatType === "group") {
      socket.emit("sendGroupMessage", {
        sender: userInfo.id,
        content: message,
        messageType: "text",
        fileUrl: undefined,
        groupId: selectedChatData._id,
      });
    }
    stopTypingNow();
    setActiveChatId(selectedChatData._id);
    setPlaceholderMessage(message);
    setMessage("");
    setRefreshChatList(true);
  };


  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Your browser does not support voice recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (!audioBlob.size) return;
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        try {
          const fileUrl = await upload(audioFile, selectedChatData._id);
          if (fileUrl) {
            if (selectedChatType === "contact") {
              socket.emit("sendMessage", {
                sender: userInfo.id,
                content: undefined,
                recipient: selectedChatData._id,
                messageType: "file",
                fileUrl,
              });
            } else if (selectedChatType === "group") {
              socket.emit("sendGroupMessage", {
                sender: userInfo.id,
                content: undefined,
                messageType: "file",
                fileUrl,
                groupId: selectedChatData._id,
              });
            }
            setActiveChatId(selectedChatData._id);
            setRefreshChatList(true);
          }
        } catch (error) {
          console.log(error);
          toast.error("Voice note upload failed.");
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.log(error);
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const fileInputRef = useRef();
  const handleFileAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleFileAttachmentChange = async (event) => {
    let fileUrl = null;

    try {
      const file = event.target.files[0];

      // alert if file size exceeds 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB");
        return;
      }
      // console.log("file:");
      // console.log(file);

      if (file) {
        // setShowFileUploadPlaceholder(true);

        fileUrl = await upload(file, selectedChatData._id);

        if (fileUrl) {
          if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
              sender: userInfo.id,
              content: undefined,
              recipient: selectedChatData._id,
              messageType: "file",
              fileUrl: fileUrl,
            });
          } else if (selectedChatType === "group") {
            socket.emit("sendGroupMessage", {
              sender: userInfo.id,
              content: undefined,
              messageType: "file",
              fileUrl: fileUrl,
              groupId: selectedChatData._id,
            });
          }

          // setShowFileUploadPlaceholder(true);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        stopTypingNow();
      }
    };
  }, [selectedChatData?._id, selectedChatType]);

  return (
    <div className="message-bar">
      <div className="message-bar-icon">
        <div
          className="emoji-picker-icon"
          ref={emojiRef}
          onClick={() => setEmojiPickerOpen((prev) => !prev)}
        >
          <RiEmojiStickerLine />
          {emojiPickerOpen && (
            <div className="emoji-picker">
              <EmojiPicker
                theme="dark"
                open={emojiPickerOpen}
                onEmojiClick={handleAddEmoji}
                autoFocusSearch={false}
              />
            </div>
          )}
        </div>
      </div>
      <button className="message-bar-icon" onClick={handleFileAttachmentClick}>
        <GrAttachment />
      </button>
      <button
        className={`message-bar-icon ${isRecording ? "recording" : ""}`}
        onClick={() => (isRecording ? stopRecording() : startRecording())}
      >
        {isRecording ? <MdStop /> : <MdMic />}
      </button>
      <input
        type="file"
        className="attachment-hidden-input"
        ref={fileInputRef}
        onChange={handleFileAttachmentChange}
      />
      <div className="message-bar-searchbar">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          ref={messageInputRef}
          onChange={(e) => {
            const nextValue = e.target.value;
            setMessage(nextValue);
            handleTyping(nextValue);
          }}
          className="message-bar-search-input"
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="message-bar-icon" onClick={handleSendMessage}>
        <IoSend />
      </div>
    </div>
  );
};

export default SingleChatMessageBar;
