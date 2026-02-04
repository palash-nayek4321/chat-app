import { useEffect, useState } from "react";
import { useAppStore } from "../../../store";
import "./SettingsPanel.css";
import { apiClient } from "../../../lib/api-client";
import { UPDATE_PREFERENCES_ROUTE } from "../../../utils/constants";
import { toast } from "react-toastify";

const SettingsPanel = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [readReceipts, setReadReceipts] = useState(
    userInfo?.readReceiptsEnabled ?? true
  );

  useEffect(() => {
    setReadReceipts(userInfo?.readReceiptsEnabled ?? true);
  }, [userInfo?.readReceiptsEnabled]);

  const updateReadReceipts = async (nextValue) => {
    try {
      const response = await apiClient.post(
        UPDATE_PREFERENCES_ROUTE,
        { readReceiptsEnabled: nextValue },
        { withCredentials: true }
      );
      if (response.data) {
        setUserInfo({ ...response.data });
      }
    } catch (error) {
      console.log(error);
      toast.error("Unable to update read receipts.");
      setReadReceipts(userInfo?.readReceiptsEnabled ?? true);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h1>Settings</h1>
        <div className="settings-subtitle">Personalize your chat experience</div>
      </div>

      <div className="settings-section">
        <div className="section-title">Account</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="row-label">Name</div>
            <div className="row-value">
              {userInfo.firstName && userInfo.lastName
                ? `${userInfo.firstName} ${userInfo.lastName}`
                : userInfo.firstName
                ? userInfo.firstName
                : userInfo.lastName
                ? userInfo.lastName
                : "Not set"}
            </div>
          </div>
          <div className="settings-row">
            <div className="row-label">Email</div>
            <div className="row-value">{userInfo.email}</div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="section-title">Notifications</div>
        <div className="settings-card">
          <button
            type="button"
            className="toggle-row"
            onClick={() => setNotificationsEnabled((prev) => !prev)}
          >
            <div>
              <div className="row-label">Desktop notifications</div>
              <div className="row-subtext">Show alerts for new messages</div>
            </div>
            <span
              className={`toggle ${notificationsEnabled ? "on" : "off"}`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="toggle-row"
            onClick={() => setSoundsEnabled((prev) => !prev)}
          >
            <div>
              <div className="row-label">Message sounds</div>
              <div className="row-subtext">Play sounds for incoming messages</div>
            </div>
            <span className={`toggle ${soundsEnabled ? "on" : "off"}`} />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="section-title">Privacy</div>
        <div className="settings-card">
          <button
            type="button"
            className="toggle-row"
            onClick={() =>
              setReadReceipts((prev) => {
                const nextValue = !prev;
                updateReadReceipts(nextValue);
                return nextValue;
              })
            }
          >
            <div>
              <div className="row-label">Read receipts</div>
              <div className="row-subtext">Let others see when you read messages</div>
            </div>
            <span className={`toggle ${readReceipts ? "on" : "off"}`} />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="section-title">Appearance</div>
        <div className="settings-card">
          <button
            type="button"
            className="toggle-row"
            onClick={() => setCompactMode((prev) => !prev)}
          >
            <div>
              <div className="row-label">Compact mode</div>
              <div className="row-subtext">Reduce spacing for smaller screens</div>
            </div>
            <span className={`toggle ${compactMode ? "on" : "off"}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
