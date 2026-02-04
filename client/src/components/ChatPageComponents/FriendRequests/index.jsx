import { useEffect, useRef, useState } from "react";
import { BsFillTriangleFill } from "react-icons/bs";
import { IoIosSearch } from "react-icons/io";
import "./FriendRequests.css";
import { useAppStore } from "../../../store";
import { apiClient } from "../../../lib/api-client";
import {
  GET_FRIEND_REQUESTS_ROUTE,
  SEARCH_FRIEND_REQUESTS_ROUTE,
} from "../../../utils/constants";
import { IoMdArrowRoundBack } from "react-icons/io";
import { toast } from "react-toastify";
import RequestChats from "../RequestChats";

const FriendRequests = () => {
  const { friendRequests, setFriendRequests } = useAppStore();
  const [searchedFriendRequests, setSearchedFriendRequests] = useState([]);

  useEffect(() => {
    const getFriendRequests = async () => {
      const response = await apiClient.get(GET_FRIEND_REQUESTS_ROUTE, {
        withCredentials: true,
      });
      if (response.data.friendRequests) {
        setFriendRequests(response.data.friendRequests);
      }
    };

    getFriendRequests();
  }, [setFriendRequests]);

  const searchFriendRequests = async (searchTerm) => {
    try {
      if (searchTerm.length > 0) {
        const response = await apiClient.post(
          SEARCH_FRIEND_REQUESTS_ROUTE,
          { searchTerm, friendRequests },
          { withCredentials: true }
        );

        if (response.status === 200 && response.data.searchedFriendRequests) {
          setSearchedFriendRequests(response.data.searchedFriendRequests);
        }
      } else {
        setSearchedFriendRequests([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onSearchInputChange = (event) => {
    if (event.target.value.length > 0) {
      setSearching(true);
    } else {
      setSearching(false);
    }
    searchFriendRequests(event.target.value);
  };

  const goBack = () => {
    setSearching(false);
    searchFriendRequests("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  // console.log("friendRequests: ", friendRequests);

  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef(null);

  return (
    <div className="friend-requests">
      <div className="header">
        <div className="sub-header">
          <h1>Friend Requests</h1>
        </div>
        <div className="search-form">
          <div className="search-icon">
            {searching ? (
              <div className="search-go-back-arrow" onClick={() => goBack()}>
                <IoMdArrowRoundBack />
              </div>
            ) : (
              <label htmlFor="search">
                <IoIosSearch />
              </label>
            )}
          </div>

          <input
            id="search"
            type="text"
            className="search-input"
            onChange={(event) => onSearchInputChange(event)}
            ref={searchInputRef}
            placeholder="Search a request"
          />
        </div>
      </div>
      <div className="request-chats-container">
        <>
          {friendRequests.length > 0 && (
            <div className="filler-container">
              <div className="horizontal-filler"></div>
              <div className="scrollbar-triangle">
                <BsFillTriangleFill />
              </div>
            </div>
          )}
          {friendRequests.length > 0 &&
            (searchedFriendRequests.length <= 0 ? (
              <RequestChats contacts={friendRequests} />
            ) : (
              <RequestChats contacts={searchedFriendRequests} />
            ))}
          {friendRequests.length > 0 && (
            <div className="filler-container">
              <div className="horizontal-filler"></div>
              <div className="scrollbar-triangle-upside-down">
                <BsFillTriangleFill />
              </div>
            </div>
          )}
        </>
      </div>
    </div>
  );
};

export default FriendRequests;
