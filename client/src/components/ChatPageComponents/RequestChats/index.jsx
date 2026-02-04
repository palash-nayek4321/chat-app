import "./RequestChats.css";
import { useAppStore } from "../../../store";
import RequestChat from "../RequestChat";

const RequestChats = ({ contacts, isGroup = false }) => {
  const { activeChatId } = useAppStore();

  return (
    <div className="request-chats">
      {contacts.map((contact) => (
        <div className="chat-outer-container" key={contact._id}>
          <RequestChat
            contact={contact}
            isGroup={isGroup}
            isActive={activeChatId === contact._id}
          />
        </div>
      ))}
    </div>
  );
};

export default RequestChats;
