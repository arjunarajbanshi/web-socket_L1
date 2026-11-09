import { useEffect, useRef, useState } from "react";
import { socket } from "../socket.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export default function ChatRoom({ username, onLeave }) {
  const [messages, setMessages] = useState([]); // chat + system messages
  const [text, setText] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // ---- 1. Load history over REST (once) ----
  useEffect(() => {
    fetch(`${SERVER_URL}/api/messages`)
      .then((r) => r.json())
      .then((history) => setMessages(history.map((m) => ({ ...m, kind: "chat" }))))
      .catch((err) => console.error("history failed", err));
  }, []);

  // ---- 2. Connect + subscribe to socket events ----
  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      // Re-announce on every (re)connect: after a reconnect the server
      // sees a brand new socket and has forgotten who we are.
      socket.emit("user:join", username);
    };
    const onDisconnect = () => setConnected(false);

    const onReceive = (msg) => setMessages((prev) => [...prev, { ...msg, kind: "chat" }]);
    const onSystem = (msg) =>
      setMessages((prev) => [...prev, { ...msg, kind: "system", _id: crypto.randomUUID() }]);
    const onCount = (n) => setOnlineCount(n);
    const onTyping = ({ user, typing }) =>
      setTypingUsers((prev) =>
        typing ? (prev.includes(user) ? prev : [...prev, user]) : prev.filter((u) => u !== user)
      );

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat:receive", onReceive);
    socket.on("system:message", onSystem);
    socket.on("users:count", onCount);
    socket.on("typing:update", onTyping);

    socket.connect();

    // CLEANUP: remove listeners, otherwise every re-render/mount
    // stacks duplicate handlers and you get double messages.
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:receive", onReceive);
      socket.off("system:message", onSystem);
      socket.off("users:count", onCount);
      socket.off("typing:update", onTyping);
      socket.disconnect();
    };
  }, [username]);

  // ---- 3. Auto-scroll to newest message ----
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- 4. Sending + typing indicator ----
  const handleChange = (e) => {
    setText(e.target.value);
    socket.emit("typing:start");
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("typing:stop"), 1200);
  };

  const send = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !connected) return;
    socket.emit("chat:send", trimmed);
    socket.emit("typing:stop");
    clearTimeout(typingTimeout.current);
    setText("");
  };

  const typingLabel =
    typingUsers.length === 0
      ? ""
      : typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.join(", ")} are typing...`;

  return (
    <div className="center">
      <div className="chat">
        <header>
          <div>
            <strong>SimpleChat</strong>
            <span className={`dot ${connected ? "on" : "off"}`} title={connected ? "connected" : "disconnected"} />
          </div>
          <div className="muted">
            {onlineCount} online · you are <b>{username}</b>
            <button className="link" onClick={onLeave}>
              Leave
            </button>
          </div>
        </header>

        <div className="messages">
          {messages.map((m) =>
            m.kind === "system" ? (
              <div key={m._id} className="system">
                {m.text}
              </div>
            ) : (
              <div key={m._id} className={`bubble ${m.user === username ? "mine" : ""}`}>
                {m.user !== username && <div className="author">{m.user}</div>}
                <div>{m.text}</div>
                <div className="time">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>

        <div className="typing">{typingLabel}</div>

        <form className="composer" onSubmit={send}>
          <input
            placeholder={connected ? "Type a message..." : "Reconnecting..."}
            value={text}
            onChange={handleChange}
            disabled={!connected}
            maxLength={1000}
          />
          <button type="submit" disabled={!connected || !text.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
