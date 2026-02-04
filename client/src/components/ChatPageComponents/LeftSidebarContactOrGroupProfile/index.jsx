import { useEffect, useState } from "react";
import "./LeftSidebarContactOrGroupProfile.css";
import moment from "moment";
import { useAppStore } from "../../../store";
import { apiClient } from "../../../lib/api-client";
import {
  GET_CONTACT_FILES_ROUTE,
  GET_GROUP_FILES_ROUTE,
  GET_GROUP_MEMBERS_ROUTE,
  GET_GROUPS_IN_COMMON_ROUTE,
  GET_USER_GROUPS_ROUTE,
} from "../../../utils/constants";
import { HiUserGroup } from "react-icons/hi";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";

const LeftSidebarContactOrGroupProfile = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const handleFilterClick = (filterName) => {
    setActiveFilter(filterName);
  };

  const {
    activeIcon,
    setActiveIcon,
    userInfo,
    setUserInfo,
    closeChat,
    contactOrGroupProfile,
    setSelectedChatType,
    setSelectedChatData,
    selectedChatData,
    setSelectedChatMessages,
    setActiveChatId,
  } = useAppStore();

  const [groupsInCommon, setGroupsInCommon] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);

  useEffect(() => {
    const getGroupsInCommon = async () => {
      try {
        const response = await apiClient.get(
          `${GET_GROUPS_IN_COMMON_ROUTE}/${contactOrGroupProfile._id}`,
          { withCredentials: true }
        );

        if (response.status === 201 && response.data.groups) {
          setGroupsInCommon(response.data.groups);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const getGroupMembers = async () => {
      try {
        const response = await apiClient.get(
          `${GET_GROUP_MEMBERS_ROUTE}/${contactOrGroupProfile._id}`,
          { withCredentials: true }
        );

        if (response.data.members) {
          setGroupMembers(response.data.members);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const getContactFiles = async () => {
      try {
        const response = await apiClient.get(
          `${GET_CONTACT_FILES_ROUTE}/${contactOrGroupProfile._id}`,
          { withCredentials: true }
        );

        if (response.data.files) {
          setSharedFiles(response.data.files);
        }
      } catch (error) {
        console.log(error);
      }
    };
    const getGroupFiles = async () => {
      try {
        const response = await apiClient.get(
          `${GET_GROUP_FILES_ROUTE}/${contactOrGroupProfile._id}`,
          { withCredentials: true }
        );

        if (response.data.files) {
          setSharedFiles(response.data.files);
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (!contactOrGroupProfile.name) {
      console.log(contactOrGroupProfile._id);
      getGroupsInCommon();
      getContactFiles();
    } else if (contactOrGroupProfile.name) {
      getGroupMembers();
      getGroupFiles();
    }
  }, [contactOrGroupProfile]);

  // console.log("sharedFiles:");
  // console.log(sharedFiles);

  const checkIfImage = (filePath) => {
    // Extract the part before the query parameters
    const pathWithoutParams = filePath.split("?")[0];

    // Define regex to check if it ends with a valid image extension
    const imageRegex =
      /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif|jfif)$/i;

    // Test the cleaned path
    return imageRegex.test(pathWithoutParams);
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

  return (
    <div className="left-sidebar-contact-or-group-profile">
      <h1>
        {contactOrGroupProfile.name
          ? contactOrGroupProfile.name
          : `${contactOrGroupProfile.firstName} ${contactOrGroupProfile.lastName}`}
      </h1>

      {/* {console.log("contactOrGroupProfile:")}
      {console.log(contactOrGroupProfile)} */}

      <div className="info-container">
        <div className="info-inputs">
          {!contactOrGroupProfile.name ? (
            contactOrGroupProfile.image ? (
              <div className="info-input-container">
                <img
                  src={contactOrGroupProfile.image}
                  alt=""
                  // alt="profile-image"
                  className="profile-image"
                />
              </div>
            ) : (
              <div className="info-input-container">
                <div className="profile-image">
                  <svg
                    viewBox="0 0 340 340"
                    // className="profile-image-default-user-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width="340"
                    height="340"
                  >
                    <path
                      fill="#2c2e3b"
                      d="m169,.5a169,169 0 1,0 2,0zm0,86a76,76 0 1
  1-2,0zM57,287q27-35 67-35h92q40,0 67,35a164,164 0 0,1-226,0"
                    />
                  </svg>
                </div>
              </div>
            )
          ) : (
            <div className="info-input-container">
              <div className="profile-image group">
                <HiUserGroup />
              </div>
            </div>
          )}
          <div className="footer">
            <div className="info-input-container">
              {!contactOrGroupProfile.name ? (
                // <div className="label">Email:</div>
                <div className="label">Contact:</div>
              ) : (
                <div className="label">Created at:</div>
              )}
              <div className="info-input">
                {contactOrGroupProfile.name ? (
                  // moment(contactOrGroupProfile.createdAt).format("YYYY-MM-DD")
                  moment(contactOrGroupProfile.createdAt).format("L")
                ) : (
                  <div className="contact-info">
                    {contactOrGroupProfile.firstName}
                    {"\u00A0"}
                    {contactOrGroupProfile.lastName}
                    {"\u00A0"}
                    {"\u00A0"}
                    <div className="contact-info-divider-container">
                      <div className="contact-info-divider"></div>
                    </div>
                    {"\u00A0"}
                    {"\u00A0"}
                    {contactOrGroupProfile.email}
                  </div>
                )}
              </div>
            </div>
            {contactOrGroupProfile.name && (
              <div className="info-input-container">
                {/* {
                  contactOrGroupProfile.name && ( */}
                <div className="label">Group members:</div>
                {/* )
                  // : (
                  //   <div className="label">Full name:</div>
                  // )
                } */}
                <div className="info-input group-members">
                  {
                    contactOrGroupProfile.name &&
                      (groupMembers.length > 0 ? (
                        <div>
                          {groupMembers.map((member) => (
                            <div className="group-member" key={member._id}>
                              {member.id === userInfo.id
                                ? "You"
                                : `${member.firstName} ${member.lastName}`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "no members"
                      ))
                    // : (
                    //   `${contactOrGroupProfile.firstName} ${contactOrGroupProfile.lastName}`
                    // )
                  }
                </div>
              </div>
            )}
            {!contactOrGroupProfile.name && (
              <div className="info-input-container">
                <div className="label">Groups in common:</div>
                <div className="info-input shared-groups">
                  {groupsInCommon.length > 0 ? (
                    <div>
                      {groupsInCommon.map((group) => (
                        <div
                          className="group-in-common"
                          key={group._id}
                          // onClick={() => handleGroupInCommonClick(group)}
                        >
                          {group.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    "no groups in common"
                  )}
                </div>
              </div>
            )}
            <div className="info-input-container">
              <div className="label">Shared files:</div>
              <div className="info-input shared-files-placeholder"></div>
            </div>
            <div className="info-input-container">
              <div className="info-input shared-files">
                {sharedFiles.length <= 0
                  ? "no shared files"
                  : sharedFiles.map((file) => (
                      <div className="shared-file" key={file._id}>
                        {checkIfImage(file.fileUrl) ? (
                          <div
                            className="image-container"
                            // onClick={() => {
                            //   setShowImage(true);
                            //   setImageURL(file.fileUrl);
                            // }}
                          >
                            <img src={file.fileUrl} alt="" />
                          </div>
                        ) : (
                          <div className="file-container">
                            <div className="file-icon-container">
                              <MdFolderZip className="file-icon" />
                            </div>
                            <div className="file-name">
                              {getFileNameFromUrl(
                                file.fileUrl.split("?")[0].split("/").pop()
                              )}
                            </div>
                            <div className="download-icon-container-link">
                              <a
                                className="download-icon-container"
                                onClick={() => handleDownload(file.fileUrl)}
                              >
                                <IoMdArrowRoundDown className="download-icon" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebarContactOrGroupProfile;
