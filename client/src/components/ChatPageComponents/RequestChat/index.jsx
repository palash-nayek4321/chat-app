import "./RequestChat.css";
import { TiTick } from "react-icons/ti";
import { IoIosClose } from "react-icons/io";
import { apiClient } from "../../../lib/api-client";
import {
  ACCEPT_FRIEND_REQUEST_ROUTE,
  REJECT_FRIEND_REQUEST_ROUTE,
} from "../../../utils/constants";
import { useAppStore } from "../../../store";

const RequestChat = ({ contact, isGroup = false, isActive = false }) => {
  const { friendRequests, setFriendRequests, setFriendRequestsCount } =
    useAppStore();

  const handleAcceptRequest = async () => {
    try {
      const response = await apiClient.put(
        ACCEPT_FRIEND_REQUEST_ROUTE,
        {
          friendEmail: contact.email,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const newFriend = {
          email: response.data.newFriend.email,
          firstName: response.data.newFriend.firstName,
          lastName: response.data.newFriend.lastName,
          image: response.data.newFriend.image,
        };

        setFriendRequestsCount(friendRequests.length - 1);
        setFriendRequests(
          friendRequests.filter((request) => request.email !== newFriend.email)
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleRejectRequest = async () => {
    try {
      const response = await apiClient.put(
        REJECT_FRIEND_REQUEST_ROUTE,
        {
          friendRequest: contact.email,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const deletedRequest = {
          email: response.data.deletedRequest.email,
          firstName: response.data.deletedRequest.firstName,
          lastName: response.data.deletedRequest.lastName,
          image: response.data.deletedRequest.image,
        };

        setFriendRequestsCount(friendRequests.length - 1);
        setFriendRequests(
          friendRequests.filter(
            (request) => request.email !== deletedRequest.email
          )
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="request-chat">
      <div className="container">
        {!isGroup && (
          <div className="chat-header-info-avatar">
            {/* <img src="./avatar.png" /> */}
            {contact.image ? (
              <img src={contact.image} alt="avatar" className="img" />
            ) : (
              <div className="img non-present">
                {contact.firstName && contact.lastName
                  ? `${contact.firstName.charAt(0)} ${contact.lastName.charAt(
                      0
                    )}`
                  : contact.firstName
                  ? contact.firstName.charAt(0)
                  : contact.lastName
                  ? contact.lastName.charAt(0)
                  : contact.email.charAt(0)}
              </div>
            )}
          </div>
        )}
        {isGroup && <div className="">#</div>}
        {isGroup ? (
          <span>{contact.name}</span>
        ) : (
          <>
            <div className="inner-container">
              <div className="inner-most-container">
                <div className="chat-info">
                  <div className="chat-info-head">
                    {contact.firstName && contact.lastName
                      ? `${contact.firstName} ${contact.lastName}`
                      : contact.firstName
                      ? contact.firstName
                      : contact.lastName
                      ? contact.lastName
                      : contact.email}
                  </div>
                  <div className={`last ${isActive ? "active-chat" : ""}`}>
                    Pending your approval
                  </div>
                </div>

                <div className="request-chat-icons">
                  <div className="icon reject" onClick={handleRejectRequest}>
                    <IoIosClose />
                  </div>
                  <div className="icon approve" onClick={handleAcceptRequest}>
                    <TiTick />
                  </div>
                </div>
              </div>

              <div className="last-message"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestChat;
