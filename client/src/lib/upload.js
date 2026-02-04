import { useAppStore } from "../store/index.js";
import { apiClient } from "./api-client.js";
import { UPLOAD_FILE_ROUTE } from "../utils/constants.js";

const upload = async (file, uploadTargetId) => {
  const { setUploadProgress, setUploadFileName, setUploadTargetId } =
    useAppStore.getState();

  setUploadTargetId(uploadTargetId);
  setUploadFileName(file.name);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!event.total) return;
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress(progress);
      },
    });

    if (!response.data?.url) {
      throw new Error("Upload failed");
    }

    setUploadProgress(0);
    setUploadTargetId(undefined);
    setUploadFileName(undefined);
    return response.data.url;
  } catch (error) {
    setUploadProgress(0);
    setUploadTargetId(undefined);
    setUploadFileName(undefined);
    throw error;
  }
};

export default upload;
