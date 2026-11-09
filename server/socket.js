import Message from "./models/Message.js";

// socket.id -> username (in-memory; fine for Level 1, Redis later in Level 3)
const onlineUsers = new Map();

export default function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    // 1. Client announces its username after connecting
    socket.on("user:join", (username) => {
      if (typeof username !== "string" || !username.trim()) return;
      const name = username.trim().slice(0, 30);

      onlineUsers.set(socket.id, name);
      socket.data.username = name;

      // to everyone except the sender
      socket.broadcast.emit("system:message", {
        text: `${name} joined the chat`,
        createdAt: new Date().toISOString(),
      });

      // to everyone, including the sender
      io.emit("users:count", onlineUsers.size);
    });

    // 2. A chat message arrives -> save it -> broadcast to all
    socket.on("chat:send", async (text) => {
      const user = socket.data.username;
      if (!user || typeof text !== "string" || !text.trim()) return;

      try {
        const saved = await Message.create({ user, text: text.trim().slice(0, 1000) });
        io.emit("chat:receive", saved.toObject());
      } catch (err) {
        console.error("save failed:", err.message);
        socket.emit("chat:error", "Message could not be sent");
      }
    });

    // 3. Typing indicator (not saved, just relayed)
    socket.on("typing:start", () => {
      if (socket.data.username) socket.broadcast.emit("typing:update", { user: socket.data.username, typing: true });
    });
    socket.on("typing:stop", () => {
      if (socket.data.username) socket.broadcast.emit("typing:update", { user: socket.data.username, typing: false });
    });

    // 4. Disconnect (tab closed, network lost, etc.)
    socket.on("disconnect", (reason) => {
      const name = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);
      console.log("disconnected:", socket.id, reason);

      if (name) {
        socket.broadcast.emit("system:message", {
          text: `${name} left the chat`,
          createdAt: new Date().toISOString(),
        });
        socket.broadcast.emit("typing:update", { user: name, typing: false });
        io.emit("users:count", onlineUsers.size);
      }
    });
  });
}
