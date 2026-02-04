import { toast } from "react-toastify";
import "./ProfileLandingPage.css";
import { apiClient } from "../../lib/api-client";
import { HOST, UPDATE_PROFILE_ROUTE } from "../../utils/constants";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store";
import { IoArrowBack } from "react-icons/io5";
import upload from "../../lib/upload";

const ProfileLandingPage = () => {
  const navigate = useNavigate();
  const {
    userInfo,
    setUserInfo,
    uploadProgress,
    setUploadProgress,
    uploadTargetId,
    setUploadTargetId,
    uploadFileName,
    setUploadFileName,
  } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo.profileSetup) {
      setFirstName(userInfo.firstName);
      setLastName(userInfo.lastName);
      setSelectedColor(userInfo.color);
    }
    if (userInfo.image) {
      setImage(`${HOST}/${userInfo.image}`);
    }
  }, [userInfo]);

  const validateProfile = () => {
    if (!firstName) {
      toast.error("First name is required");
      return false;
    }
    if (!lastName) {
      toast.error("Last name is required");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (validateProfile()) {
      try {
        const response = await apiClient.post(
          UPDATE_PROFILE_ROUTE,
          {
            firstName,
            lastName,
            color: selectedColor,
            image,
          },
          {
            withCredentials: true,
          }
        );

        if (response.status === 200 && response.data) {
          setUserInfo({ ...response.data });
          toast.success("Profile updated successfully");
          navigate("/chat");
        }
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const handleNavigate = () => {
    if (userInfo.profileSetup) {
      navigate("/chat");
    } else {
      toast.error("Please set up your profile first");
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (event) => {
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

        fileUrl = await upload(file, userInfo.id);

        if (fileUrl) {
          setImage(fileUrl);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // const handleDeleteImage = async () => {
  //   try {
  //     const response = await apiClient.delete(REMOVE_PROFILE_IMAGE_ROUTE, {
  //       withCredentials: true,
  //     });

  //     if (response.status === 200) {
  //       setUserInfo({ ...userInfo, image: null });
  //       toast.success("Profile image removed successfully");
  //       setImage(null);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     toast.error(error.message);
  //   }
  // };

  return (
    <div className="profile-landing-page">
      {/* <div>
        <div onClick={handleNavigate}>
          <IoArrowBack className="go-back-arrow" />
        </div>
      </div> */}
      <div className="info-container">
        <div className="info-inputs">
          <div className="info-input-container">
            {uploadProgress > 0 && uploadTargetId === userInfo.id ? (
              <div className="profile-landing-page-image uploading">
                {`${uploadProgress.toFixed(2)}%`}
              </div>
            ) : image ? (
              <img
                src={image}
                alt=""
                // alt="profile-image"
                className="profile-landing-page-image"
                onClick={handleImageClick}
              />
            ) : (
              <div
                className="profile-landing-page-image"
                onClick={handleImageClick}
              >
                <svg
                  viewBox="0 0 340 340"
                  // className="profile-landing-page-image-default-user-svg"
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
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
              // name="profile-image"
              accept="image/png, image/jpeg, image/jpg, image/svg, image/webp, image/jfif"
            />
          </div>
          <div className="info-input-container">
            <input
              placeholder="Email"
              type="email"
              disabled
              value={userInfo.email}
              className="info-input disabled"
            />
          </div>
          <div className="info-input-container">
            <input
              placeholder="First Name"
              type="text"
              onChange={(e) => setFirstName(e.target.value)}
              value={firstName}
              className="info-input"
            />
          </div>
          <div className="info-input-container">
            <input
              placeholder="Last Name"
              type="text"
              onChange={(e) => setLastName(e.target.value)}
              value={lastName}
              className="info-input"
            />
          </div>
        </div>
        <div className="info-input-container">
          <button
            className={`info-button ${
              firstName.length && lastName.length ? "" : "button-disabled"
            }`}
            onClick={saveChanges}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileLandingPage;
