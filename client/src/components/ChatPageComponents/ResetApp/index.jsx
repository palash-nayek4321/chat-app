import "./ResetApp.css";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "../../../lib/api-client";
import { RESET_APP_ROUTE } from "../../../utils/constants";
import { toast } from "react-toastify";

const ResetApp = () => {
  const [openResetAppModal, setOpenResetAppModal] = useState(false);
  const [resetDate, setResetDate] = useState(undefined);

  const handleResetApp = async () => {
    try {
      if (resetDate !== undefined) {
        const response = await apiClient.put(
          RESET_APP_ROUTE,
          { resetDate },
          {
            withCredentials: true,
          }
        );

        if (response.status === 200 && response.data.message) {
          console.log(response.data.message);
        }
        setOpenResetAppModal(false);
      } else {
        toast.error("Please select a date");
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An unexpected error occurred");
      }
      console.log(error);
    }
  };

  const resetAppModalRef = useRef(null);
  const resetAppDivButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resetAppModalRef.current &&
        !resetAppModalRef.current.contains(event.target) &&
        resetAppDivButtonRef.current &&
        !resetAppDivButtonRef.current.contains(event.target)
      ) {
        setOpenResetAppModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const formattedDate = selectedDate.toISOString().replace("Z", "+00:00");
    setResetDate(formattedDate);
    // console.log(formattedDate);
  };

  return (
    <div className="reset-app">
      <div className="reset-app-content">
        {/* <div className="reset-app-date"> */}
        <input type="date" onChange={handleDateChange} />
        {/* {">"}
          <div>{resetDate}</div>
        </div> */}
        <div
          onClick={() => {
            setOpenResetAppModal((prev) => !prev);
          }}
          ref={resetAppDivButtonRef}
        >
          <div className="reset-app-button">Reset App</div>
        </div>
      </div>

      {openResetAppModal && (
        <div className="reset-app-modal" ref={resetAppModalRef}>
          <div className="modal-content">
            <div className="modal-title">
              Are you sure? This operation{" "}
              <span className="red">cannot be undone</span>.
            </div>
            <div className="modal-buttons">
              <button
                className="cancel-button"
                onClick={() => setOpenResetAppModal(false)}
              >
                Cancel
              </button>
              <button className="reset-button" onClick={handleResetApp}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetApp;
