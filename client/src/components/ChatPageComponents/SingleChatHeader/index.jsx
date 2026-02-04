import { IoMdMore } from "react-icons/io";
import { IoIosSearch } from "react-icons/io";
import "./SingleChatHeader.css";
import { useAppStore } from "../../../store";
import { GET_GROUP_MEMBERS_ROUTE } from "../../../utils/constants";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "../../../lib/api-client";
import { HiUserGroup } from "react-icons/hi";
import moment from "moment";
import { MdCall, MdVideocam } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useSocket } from "../../../context/SocketContext";
import { toast } from "react-toastify";

const SingleChatHeader = () => {
  const {
    selectedChatData,
    selectedChatType,
    setActiveIcon,
    selectedChatMembers,
    setSelectedChatMembers,
    userInfo,
    setContactOrGroupProfile,
    setSelectedChatType,
    setSelectedChatData,
    setSelectedChatMessages,
    setActiveChatId,
    chatSearchOpen,
    chatSearchTerm,
    setChatSearchOpen,
    setChatSearchTerm,
  } = useAppStore();
  const searchInputRef = useRef(null);
  const [openMoreMenu, setOpenMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const moreIconRef = useRef(null);
  const socket = useSocket();
  const [callState, setCallState] = useState("idle");
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callId, setCallId] = useState(null);
  const [remoteName, setRemoteName] = useState("");
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    const getGroupMembers = async () => {
      try {
        const response = await apiClient.get(
          `${GET_GROUP_MEMBERS_ROUTE}/${selectedChatData._id}`,
          { withCredentials: true }
        );

        if (response.data.members) {
          setSelectedChatMembers(response.data.members);
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (selectedChatData._id) {
      if (selectedChatType === "group") {
        getGroupMembers();
      }
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMembers]);

  useEffect(() => {
    setChatSearchOpen(false);
    setChatSearchTerm("");
    setOpenMoreMenu(false);
    setIncomingCall(null);
    setCallState("idle");
    setCallType(null);
    setCallId(null);
  }, [selectedChatData?._id, setChatSearchOpen, setChatSearchTerm]);

  useEffect(() => {
    if (chatSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [chatSearchOpen]);

  const getSenderName = () => {
    if (!userInfo) return "Someone";
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`;
    }
    if (userInfo.firstName) return userInfo.firstName;
    if (userInfo.lastName) return userInfo.lastName;
    return userInfo.email || "Someone";
  };

  const cleanupCall = () => {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState("idle");
    setIncomingCall(null);
    setCallType(null);
    setCallId(null);
  };

  const buildPeerConnection = (recipientId, activeCallId) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("call:ice", {
          recipientId,
          candidate: event.candidate,
          callId: activeCallId,
        });
      }
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const startCall = async (type) => {
    if (!socket || selectedChatType !== "contact") return;
    const recipientId = selectedChatData._id;
    const name =
      selectedChatData.firstName && selectedChatData.lastName
        ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
        : selectedChatData.firstName
        ? selectedChatData.firstName
        : selectedChatData.lastName
        ? selectedChatData.lastName
        : selectedChatData.email;

    try {
      const newCallId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      setCallState("calling");
      setCallType(type);
      setCallId(newCallId);
      setRemoteName(name);

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
        });
      } catch (error) {
        if (type === "video") {
          toast.error("Camera busy. Falling back to audio call.");
          setCallType("audio");
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } else {
          throw error;
        }
      }

      localStreamRef.current = mediaStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      const peer = buildPeerConnection(recipientId, newCallId);
      mediaStream.getTracks().forEach((track) => peer.addTrack(track, mediaStream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("call:offer", {
        recipientId,
        callerId: userInfo.id,
        callerName: getSenderName(),
        callType: type === "video" ? callType || "video" : "audio",
        callId: newCallId,
        offer,
      });
    } catch (error) {
      console.log(error);
      toast.error("Unable to start call. Check camera/mic permissions.");
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!socket || !incomingCall) return;
    const { callerId, offer, callType: incomingType, callId: incomingCallId } =
      incomingCall;

    try {
      setCallState("in-call");
      setCallType(incomingType);
      setCallId(incomingCallId);
      setRemoteName(incomingCall.callerName || "Caller");

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: incomingType === "video",
        });
      } catch (error) {
        if (incomingType === "video") {
          toast.error("Camera busy. Joining as audio only.");
          setCallType("audio");
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } else {
          throw error;
        }
      }

      localStreamRef.current = mediaStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      const peer = buildPeerConnection(callerId, incomingCallId);
      mediaStream.getTracks().forEach((track) => peer.addTrack(track, mediaStream));

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("call:answer", {
        recipientId: callerId,
        callId: incomingCallId,
        answer,
      });
      setIncomingCall(null);
    } catch (error) {
      console.log(error);
      toast.error("Unable to access camera/mic. Close other apps and retry.");
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (!socket || !incomingCall) return;
    socket.emit("call:decline", {
      recipientId: incomingCall.callerId,
      callId: incomingCall.callId,
    });
    setIncomingCall(null);
    setCallState("idle");
  };

  const endCall = () => {
    if (!socket || selectedChatType !== "contact") {
      cleanupCall();
      return;
    }
    socket.emit("call:end", {
      recipientId: selectedChatData._id,
      callId,
    });
    cleanupCall();
  };

  useEffect(() => {
    if (!socket) return;

    const handleOffer = (payload) => {
      if (!payload || selectedChatType !== "contact") return;
      if (selectedChatData?._id !== payload.callerId) return;
      setIncomingCall(payload);
      setCallState("incoming");
    };

    const handleAnswer = async (payload) => {
      if (!payload?.answer || !peerRef.current) return;
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(payload.answer)
      );
      setCallState("in-call");
    };

    const handleIce = async (payload) => {
      if (!payload?.candidate || !peerRef.current) return;
      try {
        await peerRef.current.addIceCandidate(payload.candidate);
      } catch (error) {
        console.log(error);
      }
    };

    const handleEnd = () => {
      cleanupCall();
    };

    const handleDecline = () => {
      cleanupCall();
    };

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice", handleIce);
    socket.on("call:end", handleEnd);
    socket.on("call:decline", handleDecline);

    return () => {
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice", handleIce);
      socket.off("call:end", handleEnd);
      socket.off("call:decline", handleDecline);
    };
  }, [socket, selectedChatType, selectedChatData?._id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target) &&
        moreIconRef.current &&
        !moreIconRef.current.contains(event.target)
      ) {
        setOpenMoreMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, []);

  const getContactStatusText = () => {
    if (selectedChatData?.isOnline) return "Online";
    if (!selectedChatData?.lastSeen) return "Offline";

    const lastSeen = moment(selectedChatData.lastSeen);
    const isToday = lastSeen.isSame(moment(), "day");
    const isYesterday = lastSeen.isSame(moment().subtract(1, "day"), "day");

    if (isToday) return `Last seen today at ${lastSeen.format("LT")}`;
    if (isYesterday) return `Last seen yesterday at ${lastSeen.format("LT")}`;
    return `Last seen ${lastSeen.format("MMM D, YYYY [at] LT")}`;
  };

  return (
    <div className={`single-chat-header ${chatSearchOpen ? "search-open" : ""}`}>
      <div className="user">
        <button
          type="button"
          className="mobile-back-button"
          onClick={() => {
            setActiveChatId(undefined);
            setSelectedChatType(undefined);
            setSelectedChatData(undefined);
            setSelectedChatMessages([]);
          }}
          aria-label="Back to chats"
        >
          <IoMdArrowRoundBack />
        </button>
        <div
          className="avatar"
          onClick={() => {
            setContactOrGroupProfile(selectedChatData);
            setActiveIcon("contactOrGroupProfile");
          }}
        >
          {selectedChatData.name ? (
            // <img src="./avatar.png" className="img non-present" />
            <div className="img group-img">
              <HiUserGroup />
            </div>
          ) : selectedChatData.image ? (
            <img src={selectedChatData.image} alt="avatar" className="img" />
          ) : (
            <div className="img non-present">
              {selectedChatData.firstName && selectedChatData.lastName
                ? `${selectedChatData.firstName.charAt(
                    0
                  )} ${selectedChatData.lastName.charAt(0)}`
                : selectedChatData.firstName
                ? selectedChatData.firstName.charAt(0)
                : selectedChatData.lastName
                ? selectedChatData.lastName.charAt(0)
                : selectedChatData.email.charAt(0)}
            </div>
          )}
        </div>
        <div
          className="info"
          onClick={() => {
            setContactOrGroupProfile(selectedChatData);
            setActiveIcon("contactOrGroupProfile");
          }}
        >
          <div>
            {selectedChatType === "group" && selectedChatData.name}
            {selectedChatType === "contact" &&
              (selectedChatData.firstName && selectedChatData.lastName
                ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                : selectedChatData.firstName
                ? selectedChatData.firstName
                : selectedChatData.lastName
                ? selectedChatData.lastName
                : selectedChatData.email)}
          </div>
          {selectedChatType === "group" ? (
            <div className="group-members">
              {selectedChatMembers.map((member, index) => (
                <span key={member.id} className="member">
                  {member.id === userInfo.id
                    ? "You"
                    : `${member.firstName} ${member.lastName}`}
                  {index < selectedChatMembers.length - 1 && `,\u00A0`}
                </span>
              ))}
            </div>
          ) : (
            <div>{getContactStatusText()}</div>
          )}
        </div>
        <div></div>
      </div>
      <div className="icons">
        {selectedChatType === "contact" && (
          <>
            <div className="icon" onClick={() => startCall("audio")}>
              <MdCall />
            </div>
            <div className="icon" onClick={() => startCall("video")}>
              <MdVideocam />
            </div>
          </>
        )}
        <div className={`chat-search ${chatSearchOpen ? "open" : ""}`}>
          <input
            ref={searchInputRef}
            type="text"
            value={chatSearchTerm}
            onChange={(event) => setChatSearchTerm(event.target.value)}
            placeholder="Search in chat"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setChatSearchOpen(false);
                setChatSearchTerm("");
              }
            }}
          />
        </div>
        <div
          className={`icon ${chatSearchOpen ? "active" : ""}`}
          onClick={() => {
            if (chatSearchOpen) {
              setChatSearchOpen(false);
              setChatSearchTerm("");
            } else {
              setChatSearchOpen(true);
            }
          }}
        >
          <IoIosSearch />
        </div>
        <div
          className="icon"
          onClick={() => setOpenMoreMenu((prev) => !prev)}
          ref={moreIconRef}
        >
          <IoMdMore />
        </div>
        {openMoreMenu && (
          <div className="chat-header-menu" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => {
                setOpenMoreMenu(false);
                setContactOrGroupProfile(selectedChatData);
                setActiveIcon("contactOrGroupProfile");
              }}
            >
              View profile
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenMoreMenu(false);
                setChatSearchOpen(true);
              }}
            >
              Search in chat
            </button>
          </div>
        )}
      </div>
      {(callState === "calling" || callState === "in-call") && (
        <div className="call-overlay">
          <div className="call-card">
            <div className="call-header">
              <div className="call-title">
                {callType === "video" ? "Video call" : "Audio call"}
              </div>
              <div className="call-subtitle">
                {callState === "calling" ? "Calling..." : "In call"}
              </div>
              <div className="call-peer">{remoteName}</div>
            </div>
            <div className={`call-video-grid ${callType === "audio" ? "audio" : ""}`}>
              <video ref={remoteVideoRef} autoPlay playsInline />
              <video ref={localVideoRef} autoPlay muted playsInline />
            </div>
            <div className="call-actions">
              <button className="end-call" onClick={endCall} type="button">
                End call
              </button>
            </div>
          </div>
        </div>
      )}
      {callState === "incoming" && incomingCall && (
        <div className="call-overlay">
          <div className="call-card">
            <div className="call-header">
              <div className="call-title">
                Incoming {incomingCall.callType === "video" ? "video" : "audio"} call
              </div>
              <div className="call-peer">{incomingCall.callerName || "Caller"}</div>
            </div>
            <div className="call-actions">
              <button className="accept-call" onClick={acceptCall} type="button">
                Accept
              </button>
              <button className="end-call" onClick={declineCall} type="button">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleChatHeader;
