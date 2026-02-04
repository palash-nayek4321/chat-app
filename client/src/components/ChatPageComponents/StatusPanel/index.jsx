import { useEffect, useState } from "react";
import moment from "moment";
import "./StatusPanel.css";
import { apiClient } from "../../../lib/api-client";
import upload from "../../../lib/upload";
import {
  CREATE_STATUS_ROUTE,
  DELETE_STATUS_ROUTE,
  GET_MY_STATUS_ROUTE,
  GET_STATUS_FEED_ROUTE,
} from "../../../utils/constants";
import { useAppStore } from "../../../store";
import { toast } from "react-toastify";
import { MdDelete } from "react-icons/md";

const StatusPanel = () => {
  const { userInfo } = useAppStore();
  const [myStatuses, setMyStatuses] = useState([]);
  const [feedStatuses, setFeedStatuses] = useState([]);
  const [openComposer, setOpenComposer] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [statusImage, setStatusImage] = useState(null);
  const [statusPreview, setStatusPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadStatuses = async () => {
    try {
      const [mineResponse, feedResponse] = await Promise.all([
        apiClient.get(GET_MY_STATUS_ROUTE, { withCredentials: true }),
        apiClient.get(GET_STATUS_FEED_ROUTE, { withCredentials: true }),
      ]);

      if (mineResponse.data.statuses) {
        setMyStatuses(mineResponse.data.statuses);
      }
      if (feedResponse.data.statuses) {
        setFeedStatuses(feedResponse.data.statuses);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatusImage(file);
    setStatusPreview(URL.createObjectURL(file));
  };

  const createStatus = async () => {
    if (!statusText.trim() || !statusImage) {
      toast.error("Please add both text and an image.");
      return;
    }

    try {
      setSubmitting(true);
      const imageUrl = await upload(statusImage, userInfo.id);
      const response = await apiClient.post(
        CREATE_STATUS_ROUTE,
        { text: statusText.trim(), imageUrl },
        { withCredentials: true }
      );

      if (response.data.status) {
        toast.success("Status added");
        setStatusText("");
        setStatusImage(null);
        setStatusPreview(null);
        setOpenComposer(false);
        loadStatuses();
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to add status.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteStatus = async (statusId) => {
    try {
      await apiClient.delete(`${DELETE_STATUS_ROUTE}/${statusId}`, {
        withCredentials: true,
      });
      setMyStatuses((prev) => prev.filter((status) => status._id !== statusId));
      toast.success("Status deleted");
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete status.");
    }
  };

  return (
    <div className="status-panel">
      <div className="status-header">
        <div>
          <h2>Status</h2>
          <p>Share a photo and a short update. Expires in 24 hours.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setOpenComposer(true)}
        >
          Add status
        </button>
      </div>

      <div className="status-section">
        <div className="status-section-header">
          <h3>My status</h3>
        </div>
        {myStatuses.length === 0 ? (
          <div className="status-empty">You have no active status.</div>
        ) : (
          <div className="status-grid">
            {myStatuses.map((status) => (
              <div className="status-card" key={status._id}>
                <button
                  type="button"
                  className="status-delete-button"
                  onClick={() => deleteStatus(status._id)}
                  aria-label="Delete status"
                >
                  <MdDelete />
                </button>
                <div className="status-image">
                  <img src={status.imageUrl} alt="My status" />
                </div>
                <div className="status-body">
                  <div className="status-text">{status.text}</div>
                  <div className="status-meta">
                    {moment(status.createdAt).fromNow()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="status-section">
        <h3>Friends</h3>
        {feedStatuses.length === 0 ? (
          <div className="status-empty">No new updates yet.</div>
        ) : (
          <div className="status-grid">
            {feedStatuses.map((status) => (
              <div className="status-card" key={status._id}>
                <div className="status-image">
                  <img src={status.imageUrl} alt="Status" />
                </div>
                <div className="status-body">
                  <div className="status-owner">
                    {status.owner?.firstName && status.owner?.lastName
                      ? `${status.owner.firstName} ${status.owner.lastName}`
                      : status.owner?.email}
                  </div>
                  <div className="status-text">{status.text}</div>
                  <div className="status-meta">
                    {moment(status.createdAt).fromNow()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openComposer && (
        <div className="status-modal">
          <div className="status-modal-card">
            <div className="modal-header">
              <h3>New status</h3>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setOpenComposer(false)}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <label className="status-label">Status text</label>
              <textarea
                value={statusText}
                onChange={(event) => setStatusText(event.target.value)}
                placeholder="What's on your mind?"
              />

              <label className="status-label">Photo</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {statusPreview && (
                <div className="status-preview">
                  <img src={statusPreview} alt="Preview" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="primary-button"
                onClick={createStatus}
                disabled={submitting}
              >
                {submitting ? "Uploading..." : "Share status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusPanel;
