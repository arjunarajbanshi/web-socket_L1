import { useState } from "react";
import JoinScreen from "./components/JoinScreen.jsx";
import ChatRoom from "./components/ChatRoom.jsx";

export default function App() {
  const [username, setUsername] = useState("");

  return username ? (
    <ChatRoom username={username} onLeave={() => setUsername("")} />
  ) : (
    <JoinScreen onJoin={setUsername} />
  );
}
