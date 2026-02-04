import "./Chats.css";
import Chat from "../Chat";
import { useAppStore } from "../../../store";

const Chats = ({ contacts, isGroup = false }) => {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
    activeChatId,
    setActiveChatId,
  } = useAppStore();

  const handleClick = (contact) => {
    setSelectedChatType(isGroup ? "group" : "contact");
    setSelectedChatData(contact);
    setActiveChatId(contact._id);

    if (selectedChatData && selectedChatData._id !== contact._id) {
      setSelectedChatMessages([]);
    }
  };

  return (
    <div className="chats">
      {contacts.map((contact) => (
        <div key={contact._id} onClick={() => handleClick(contact)}>
          <Chat
            contact={contact}
            isGroup={isGroup}
            isActive={activeChatId === contact._id}
          />
        </div>
      ))}
    </div>
  );
};

export default Chats;
