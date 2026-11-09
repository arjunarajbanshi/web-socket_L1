// EXPERIMENT: the raw WebSocket protocol with the `ws` package (no Socket.IO).
// Run:  npm run raw
// Then open any page's browser console (F12) and paste:
//
//   const ws = new WebSocket("ws://localhost:8080");
//   ws.onmessage = (e) => console.log("got:", e.data);
//   ws.onopen = () => ws.send("hello from browser");
//
// Open it in two tabs and send messages: you'll see the broadcast.
// Notice what you must build yourself: rooms, reconnect, event names, JSON parsing.
// That is exactly what Socket.IO adds on top.

import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("client connected, total:", wss.clients.size);
  ws.send("welcome!");

  ws.on("message", (data) => {
    const text = data.toString();
    console.log("received:", text);

    // broadcast to every open client
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(text);
    });
  });

  ws.on("close", () => console.log("client left, total:", wss.clients.size));
});

console.log("Raw WebSocket server on ws://localhost:8080");
