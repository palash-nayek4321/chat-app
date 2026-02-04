import { useEffect, useRef, useState } from "react";
import { RiChatNewFill } from "react-icons/ri";
import { IoMdMore } from "react-icons/io";
import { BsFillTriangleFill } from "react-icons/bs";
import { IoPersonAdd, IoSunnyOutline, IoMoonOutline } from "react-icons/io5";
import { IoIosSearch } from "react-icons/io";
import { MdGroupAdd } from "react-icons/md";
import "./ChatList.css";
import Chats from "../Chats";
import { useAppStore } from "../../../store";
import { apiClient } from "../../../lib/api-client";
import {
  CREATE_FRIEND_REQUEST_ROUTE,
  CREATE_GROUP_ROUTE,
  GET_ALL_CONTACTS_ROUTE,
  GET_DM_CONTACTS_ROUTE,
  GET_USER_GROUPS_ROUTE,
  SEARCH_CONTACTS_ROUTE,
  SEARCH_DM_CONTACTS_ROUTE,
  SEARCH_GROUPS_ROUTE,
} from "../../../utils/constants";
import LeftSidebarProfile from "../LeftSidebarProfile";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaAddressCard } from "react-icons/fa";
import { IoMdAddCircle } from "react-icons/io";
import { toast } from "react-toastify";
import FriendRequests from "../FriendRequests";
import { useSocket } from "../../../context/SocketContext";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import LeftSidebarContactOrGroupProfile from "../LeftSidebarContactOrGroupProfile";
import SettingsPanel from "../SettingsPanel";
import StatusPanel from "../StatusPanel";

const ChatList = () => {
  const { activeIcon, setActiveIcon } = useAppStore();
  const { activeFilter, setActiveFilter } = useAppStore();
  const { refreshChatList, setRefreshChatList, userInfo } = useAppStore();

  // const [activeFilter, setActiveFilter] = useState("all");
  const handleFilterClick = (filterName) => {
    setActiveFilter(filterName);
  };

  const {
    directMessagesContacts,
    setDirectMessagesContacts,
    groups,
    setGroups,
    addGroupInGroupList,
    addContactsInDmContacts,
    selectedChatMessages,
  } = useAppStore();
  const socket = useSocket();

  const getContacts = async () => {
    const response = await apiClient.get(GET_DM_CONTACTS_ROUTE, {
      withCredentials: true,
    });
    if (response.data.contacts) {
      // console.log("Fetched contacts:", response.data.contacts);
      setDirectMessagesContacts(response.data.contacts);
    }
  };

  const getGroups = async () => {
    const response = await apiClient.get(GET_USER_GROUPS_ROUTE, {
      withCredentials: true,
    });
    if (response.data.groups) {
      setGroups(response.data.groups);
      // addGroupInGroupList(response.data.groups);
    }
  };

  useEffect(() => {
    getContacts();
    getGroups();
  }, [
    refreshChatList,
    setGroups,
    setDirectMessagesContacts,
    addGroupInGroupList,
    // addContactsInDmContacts,
    selectedChatMessages,
  ]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const nextTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const { setSelectedChatType, setSelectedChatData, selectedChatData } =
    useAppStore();
  const [openNewContactModal, setOpenNewContactModal] = useState(false);
  const [openAddContactModal, setOpenAddContactModal] = useState(false);
  const [openCreateGroupModal, setOpenCreateGroupModal] = useState(false);
  const [searchedContacts, setSearchedContacts] = useState([]);
  const [searchedGroups, setSearchedGroups] = useState([]);
  const [searchedModalContacts, setSearchedModalContacts] = useState([]);
  const [openHeaderMenu, setOpenHeaderMenu] = useState(false);
  const [theme, setTheme] = useState("dark");

  const searchContacts = async (searchTerm) => {
    try {
      if (searchTerm.length > 0) {
        const response = await apiClient.post(
          SEARCH_DM_CONTACTS_ROUTE,
          { searchTerm, directMessagesContacts },
          { withCredentials: true }
        );

        if (response.status === 200 && response.data.contacts) {
          setSearchedContacts(response.data.contacts);
        }
      } else {
        setSearchedContacts([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const searchGroups = async (searchTerm) => {
    try {
      if (searchTerm.length > 0) {
        const response = await apiClient.post(
          SEARCH_GROUPS_ROUTE,
          { searchTerm, groups },
          { withCredentials: true }
        );

        if (response.status === 200 && response.data.searchedGroups) {
          setSearchedGroups(response.data.searchedGroups);
        }
      } else {
        setSearchedGroups([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const searchModalContacts = async (searchTerm) => {
    try {
      // if (searchTerm.length > 0) {
      const response = await apiClient.post(
        SEARCH_CONTACTS_ROUTE,
        { searchTerm },
        { withCredentials: true }
      );

      if (response.status === 200 && response.data.contacts) {
        setSearchedModalContacts(response.data.contacts);
      }
      // } else {
      //   setSearchedModalContacts([]);
      // }
    } catch (error) {
      console.log(error);
    }
  };

  const selectNewContact = (contact) => {
    setOpenNewContactModal(false);
    setSelectedChatType("contact");
    console.log(contact);
    setSelectedChatData(contact);
    setSearchedModalContacts([]);
    setRefreshChatList(false);

    // if (selectedChatData && selectedChatData._id !== contact._id) {
    //   setSelectedChatMessages([]);
    // }
    console.log(selectedChatData);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendFriendRequestToContact(contactTag);
    }
  };

  const sendFriendRequestToContact = async (contactTag) => {
    setOpenAddContactModal(false);

    if (contactTag === userInfo.email) {
      toast.error("Cannot send friend request to yourself");
      setContactTag("");
      setOpenAddContactModal(true);
      return;
    }

    try {
      if (contactTag) {
        const response = await apiClient.post(
          CREATE_FRIEND_REQUEST_ROUTE,
          { friendRequest: contactTag },
          { withCredentials: true }
        );

        if (response.status === 201) {
          setContactTag("");
          setOpenAddContactModal(false);
          // console.log(response.data);
          // console.log(response.data.requester);

          socket.emit("sendFriendRequest", {
            target: response.data.target,
            friendRequest: response.data.requester,
          });
          toast.success(
            `Friend request sent to the user with email: ${contactTag}`
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const newContactModalRef = useRef(null);
  const newContactIconRef = useRef(null);
  const addContactModalRef = useRef(null);
  const addContactIconRef = useRef(null);
  const createGroupModalRef = useRef(null);
  const createGroupIconRef = useRef(null);
  const headerMenuRef = useRef(null);
  const headerMenuIconRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        newContactModalRef.current &&
        !newContactModalRef.current.contains(event.target) &&
        newContactIconRef.current &&
        !newContactIconRef.current.contains(event.target)
      ) {
        setOpenNewContactModal(false);
      }
    };
    const handleClickOutsideAddContact = (event) => {
      if (
        addContactModalRef.current &&
        !addContactModalRef.current.contains(event.target) &&
        addContactIconRef.current &&
        !addContactIconRef.current.contains(event.target)
      ) {
        setOpenAddContactModal(false);
      }
    };

    const handleClickOutsideCreateGroup = (event) => {
      if (
        createGroupModalRef.current &&
        !createGroupModalRef.current.contains(event.target) &&
        createGroupIconRef.current &&
        !createGroupIconRef.current.contains(event.target)
      ) {
        setOpenCreateGroupModal(false);
      }
    };
    const handleClickOutsideHeaderMenu = (event) => {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(event.target) &&
        headerMenuIconRef.current &&
        !headerMenuIconRef.current.contains(event.target)
      ) {
        setOpenHeaderMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("mousedown", handleClickOutsideAddContact);
    document.addEventListener("mousedown", handleClickOutsideCreateGroup);
    document.addEventListener("mousedown", handleClickOutsideHeaderMenu);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutsideAddContact);
      document.removeEventListener("mousedown", handleClickOutsideCreateGroup);
      document.removeEventListener("mousedown", handleClickOutsideHeaderMenu);
    };
  }, []);

  useEffect(() => {
    if (openNewContactModal && searchNewContactInputRef.current) {
      searchNewContactInputRef.current.focus();
    }

    if (openAddContactModal && searchAddContactInputRef.current) {
      searchAddContactInputRef.current.focus();
    }

    if (openCreateGroupModal && searchCreateGroupInputRef.current) {
      searchCreateGroupInputRef.current.focus();
    }
  }, [openNewContactModal, openAddContactModal, openCreateGroupModal]);

  const [searching, setSearching] = useState(false);

  const onSearchInputChange = (event) => {
    if (event.target.value.length > 0) {
      setSearching(true);
    } else {
      setSearching(false);
    }
    searchContacts(event.target.value);
    searchGroups(event.target.value);
  };

  const goBack = () => {
    setSearching(false);
    searchContacts("");
    searchGroups("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  const searchInputRef = useRef(null);
  const searchNewContactInputRef = useRef(null);
  const searchAddContactInputRef = useRef(null);
  const searchCreateGroupInputRef = useRef(null);

  const [contactTag, setContactTag] = useState("");
  const [groupName, setGroupName] = useState("");

  const animatedComponents = makeAnimated();

  const [allContacts, setAllContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);

  useEffect(() => {
    const getAllContacts = async () => {
      const response = await apiClient.get(GET_ALL_CONTACTS_ROUTE, {
        withCredentials: true,
      });

      const contacts = response.data.contacts.map((user) => ({
        label: user.firstName
          ? `${user.firstName} ${user.lastName}`
          : user.email,
        value: user._id,
      }));

      setAllContacts(contacts);
    };

    getAllContacts();
  }, [openCreateGroupModal]);

  const createGroup = async () => {
    try {
      if (groupName.length > 0) {
        const response = await apiClient.post(
          CREATE_GROUP_ROUTE,
          {
            name: groupName,
            members: selectedContacts.map((contact) => contact.value),
            isGroup: true,
          },
          { withCredentials: true }
        );
        if (response.status === 201) {
          setGroupName("");
          setSelectedContacts([]);
          setOpenCreateGroupModal(false);
          socket.emit("createGroup", response.data.group);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="chat-list">
      {activeIcon === "chat" ? (
        <>
          <div className="header">
            <div className="sub-header">
              <h1>Chats</h1>
              <div className="sub-header-icons">
                <button
                  type="button"
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <IoSunnyOutline /> : <IoMoonOutline />}
                  <span>{theme === "dark" ? "Light" : "Dark"}</span>
                </button>
                <div
                  onClick={() => {
                    setOpenAddContactModal((prev) => !prev);
                  }}
                  ref={addContactIconRef}
                >
                  <div
                    className={`tooltip sub-header-icon ${
                      openAddContactModal ? "active-modal" : ""
                    }`}
                  >
                    {/*<FaAddressCard />*/}
                    <IoPersonAdd className="add-new-friend" />
                    <span className="tooltiptext">Add New Friend</span>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setOpenCreateGroupModal((prev) => !prev);
                  }}
                  ref={createGroupIconRef}
                >
                  <div
                    className={`tooltip sub-header-icon ${
                      openCreateGroupModal ? "active-modal" : ""
                    }`}
                  >
                    {/*<FaAddressCard />*/}
                    <MdGroupAdd />
                    <span className="tooltiptext">New Group</span>
                  </div>
                </div>
                <div
                  onClick={() => {
                    searchModalContacts("");
                    setOpenNewContactModal((prev) => !prev);
                  }}
                  ref={newContactIconRef}
                >
                  <div
                    className={`tooltip sub-header-icon ${
                      openNewContactModal ? "active-modal" : ""
                    }`}
                  >
                    <RiChatNewFill />
                    <span className="tooltiptext">New Chat</span>
                  </div>
                </div>

                {openCreateGroupModal && (
                  <div className="create-group-modal" ref={createGroupModalRef}>
                    <div className="modal-content">
                      <div className="modal-header">
                        <div className="modal-title">Create New Group</div>
                      </div>
                      <div className="create-group-input-container">
                        <input
                          placeholder="Group Name"
                          value={groupName}
                          onChange={(event) => setGroupName(event.target.value)}
                          className="modal-input"
                          ref={searchCreateGroupInputRef}
                        />
                        <div className="multi-select-container">
                          {/* MULTI SELECT FOR ADDING CONTACTS TO GROUP */}
                          <Select
                            className="multi-select"
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            isMulti
                            options={allContacts}
                            value={selectedContacts}
                            onChange={setSelectedContacts}
                            placeholder={"Select user(s)"}
                            styles={{
                              container: (styles) => ({
                                ...styles,
                                width: "13rem",
                              }),

                              // a
                              option: (styles) => ({
                                ...styles,
                                color: "#111b21",
                              }),
                              multiValue: (styles) => ({
                                ...styles,
                                backgroundColor: "lightgray",
                              }),
                              multiValueLabel: (styles) => ({
                                ...styles,
                                color: "#111b21",
                              }),
                              multiValueRemove: (styles) => ({
                                ...styles,
                                color: "#111b21",
                              }),
                            }}
                          />
                        </div>

                        <div
                          className={`submit-button ${
                            groupName.length <= 0 ? "modal-icon-disabled" : ""
                          }`}
                          onClick={createGroup}
                        >
                          Create
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {openAddContactModal && (
                  <div
                    className="add-new-friend-contact-modal"
                    ref={addContactModalRef}
                  >
                    <div className="modal-content">
                      <div className="modal-header">
                        <div className="modal-title">Add a new contact</div>
                      </div>
                      <div className="add-friend-contact-input-container">
                        <input
                          placeholder="john@example.com"
                          value={contactTag}
                          onChange={(event) =>
                            setContactTag(event.target.value)
                          }
                          onKeyDown={handleKeyDown}
                          ref={searchAddContactInputRef}
                          className="modal-input"
                        />
                        <div
                          className={`sub-header-icon ${
                            contactTag.length <= 0 ? "modal-icon-disabled" : ""
                          }`}
                          onClick={() => sendFriendRequestToContact(contactTag)}
                        >
                          <IoMdAddCircle />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {openNewContactModal && (
                  <div
                    className="add-new-contact-modal"
                    ref={newContactModalRef}
                  >
                    <div className="modal-content">
                      <div className="modal-header">
                        <div className="modal-title">Select a contact</div>
                      </div>
                      <div>
                        <input
                          placeholder="Search Contacts"
                          onChange={(event) =>
                            searchModalContacts(event.target.value)
                          }
                          ref={searchNewContactInputRef}
                          className="modal-input"
                        />
                      </div>
                      {/* {console.log("searchedModalContacts.length")}
                      {console.log(searchedModalContacts.length)} */}
                      {/* {searchedModalContacts.length <= 0 ? null : (
                        <> */}
                      <div className="filler-container">
                        <div className="horizontal-filler"></div>
                        <div className="scrollbar-triangle">
                          <BsFillTriangleFill />
                        </div>
                      </div>
                      <div className="contacts-container">
                        <div className="searched-contacts">
                          {/* {console.log("searchedModalContacts")}
                          {console.log(searchedModalContacts)} */}
                          {searchedModalContacts.map((contact) => (
                            <div
                              key={contact._id}
                              className="single-contact"
                              onClick={() => selectNewContact(contact)}
                            >
                              <div className="avatar-main-container">
                                <div className="avatar-inner-container">
                                  {contact.image ? (
                                    // <div className="select-contact-image">
                                    <img
                                      src={contact.image}
                                      alt="profile"
                                      className="select-contact-image"
                                    />
                                  ) : (
                                    //</div>
                                    <div className="select-contact-image no-avatar">
                                      {contact.firstName && contact.lastName
                                        ? `${contact.firstName.charAt(
                                            0
                                          )} ${contact.lastName.charAt(0)}`
                                        : contact.firstName
                                        ? contact.firstName.charAt(0)
                                        : contact.lastName
                                        ? contact.lastName.charAt(0)
                                        : contact.email.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="single-contact-info">
                                <div>
                                  {contact.firstName && contact.lastName
                                    ? `${contact.firstName} ${contact.lastName}`
                                    : contact.email}
                                </div>
                                <div>{contact.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="filler-container">
                        <div className="horizontal-filler"></div>
                        <div className="scrollbar-triangle-upside-down">
                          <BsFillTriangleFill />
                        </div>
                      </div>
                      {/* </>
                      )} */}
                    </div>
                  </div>
                )}

                <div
                  className="sub-header-icon"
                  onClick={() => setOpenHeaderMenu((prev) => !prev)}
                  ref={headerMenuIconRef}
                >
                  <IoMdMore />
                </div>
                {openHeaderMenu && (
                  <div className="chat-header-menu" ref={headerMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenHeaderMenu(false);
                        getContacts();
                        getGroups();
                      }}
                    >
                      Refresh chats
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenHeaderMenu(false);
                        setOpenNewContactModal(true);
                        searchModalContacts("");
                      }}
                    >
                      New chat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenHeaderMenu(false);
                        setOpenAddContactModal(true);
                      }}
                    >
                      Add friend
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenHeaderMenu(false);
                        setOpenCreateGroupModal(true);
                      }}
                    >
                      New group
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="search-form">
              <div className="search-icon">
                {searching ? (
                  <div
                    className="search-go-back-arrow"
                    onClick={() => goBack()}
                  >
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
                placeholder="Search"
              />
            </div>
            <div className={`filters ${searching ? "searching" : ""}`}>
              <div
                className={`filter ${
                  activeFilter === "all" ? "active-filter" : ""
                }`}
                onClick={() => handleFilterClick("all")}
              >
                All
              </div>
              <div
                className={`filter ${
                  activeFilter === "dms" ? "active-filter" : ""
                }`}
                onClick={() => handleFilterClick("dms")}
              >
                DMs
              </div>
              <div
                className={`filter ${
                  activeFilter === "groups" ? "active-filter" : ""
                }`}
                onClick={() => handleFilterClick("groups")}
              >
                Groups
              </div>
              <div
                className={`filter ${
                  activeFilter === "status" ? "active-filter" : ""
                }`}
                onClick={() => handleFilterClick("status")}
              >
                Status
              </div>
            </div>
          </div>

          {activeFilter === "status" ? (
            <StatusPanel />
          ) : (
            <>
              {(directMessagesContacts.length > 0 || groups.length > 0) && (
                <div className="filler-container">
                  <div className="horizontal-filler"></div>
                  <div className="scrollbar-triangle">
                    <BsFillTriangleFill />
                  </div>
                </div>
              )}
              <div className="dms-and-group-chats-container">
                {directMessagesContacts.length > 0 || groups.length > 0 ? (
                  <>
                    {searchedContacts.length <= 0 &&
                    searchedGroups.length <= 0 ? (
                      <>
                        {groups.length > 0 &&
                          (activeFilter === "all" ||
                            activeFilter === "groups") &&
                          activeFilter !== "dms" && (
                            <>
                              <div className="chat-type-indicator groups">
                                Groups
                              </div>
                              <Chats contacts={groups} isGroup={true} />
                            </>
                          )}
                        {directMessagesContacts.length > 0 &&
                          (activeFilter === "all" || activeFilter === "dms") &&
                          activeFilter !== "groups" && (
                            <>
                              <div className="chat-type-indicator dms">
                                Direct Messages
                              </div>
                              <Chats contacts={directMessagesContacts} />
                            </>
                          )}
                      </>
                    ) : (
                      <>
                        {searchedGroups.length > 0 && (
                          <>
                            <div className="chat-type-indicator groups">
                              Groups
                            </div>
                            <Chats contacts={searchedGroups} isGroup={true} />
                          </>
                        )}
                        {searchedContacts.length > 0 && (
                          <>
                            <div className="chat-type-indicator dms">
                              Direct Messages
                            </div>
                            <Chats contacts={searchedContacts} />
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : null}
              </div>
              {(directMessagesContacts.length > 0 || groups.length > 0) && (
                <div className="filler-container">
                  <div className="horizontal-filler"></div>
                  <div className="scrollbar-triangle-upside-down">
                    <BsFillTriangleFill />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : activeIcon === "avatar" ? (
        <LeftSidebarProfile />
      ) : activeIcon === "friend-requests" ? (
        <FriendRequests />
      ) : activeIcon === "contactOrGroupProfile" ? (
        <LeftSidebarContactOrGroupProfile />
      ) : (
        <SettingsPanel />
      )}
    </div>
  );
};

export default ChatList;
