import { useAppStore } from "../../../store";
import SingleChatHeader from "../SingleChatHeader";
import SingleChatMessageBar from "../SingleChatMessageBar";
import SingleChatMessageContainer from "../SingleChatMessageContainer";
import ResetApp from "../ResetApp";
import "./SingleChat.css";

const SingleChat = () => {
  const { selectedChatType, userInfo } = useAppStore();

  return (
    <div className="single-chat">
      {selectedChatType ? (
        <>
          <SingleChatHeader />
          <SingleChatMessageContainer />
          <SingleChatMessageBar />
        </>
      ) : userInfo.isAdmin ? (
        <ResetApp />
      ) : null}
    </div>
  );
};

export default SingleChat;
