# SimpleChat (Level 1)

A single-room real-time chat built with **MongoDB, Express, React, Node + Socket.IO**.

## Run it

Prerequisites: Node 18+ and MongoDB running locally (or a MongoDB Atlas URI).

```bash
# terminal 1 - server
cd server
cp .env.example .env
npm install
npm run dev          # http://localhost:5000

# terminal 2 - client
cd client
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

Open http://localhost:5173 in **two browser windows** (one normal, one incognito) with different names and chat between them.

## Project structure

```
simplechat/
├── server/
│   ├── index.js                # Express + HTTP server + Socket.IO + Mongo connection
│   ├── socket.js               # ALL socket event handlers (the heart of the app)
│   ├── models/Message.js       # Mongoose schema
│   ├── routes/messages.js      # GET /api/messages (history over REST)
│   └── experiments/raw-ws.js   # Step 0: raw WebSocket with the `ws` package
└── client/
    └── src/
        ├── socket.js               # single shared socket instance
        ├── App.jsx                 # join screen <-> chat room
        └── components/
            ├── JoinScreen.jsx
            └── ChatRoom.jsx        # listeners, cleanup, sending, typing
```

## Event map (memorize this)

| Event | Direction | Purpose |
|---|---|---|
| `user:join` | client -> server | announce username |
| `chat:send` | client -> server | send a message (text) |
| `chat:receive` | server -> all | saved message broadcast |
| `system:message` | server -> others | "X joined / left" |
| `users:count` | server -> all | online count |
| `typing:start` / `typing:stop` | client -> server | typing state |
| `typing:update` | server -> others | who is typing |
| `chat:error` | server -> sender | save failed |

## Learning path (do in this order)

### Day 1 - Raw WebSocket
1. `cd server && npm install && npm run raw`
2. Paste the browser-console snippet from `experiments/raw-ws.js` into two tabs.
3. In DevTools -> Network -> WS, click the connection and watch frames.
4. Look at the first request: find `Upgrade: websocket` and status `101 Switching Protocols`.

**Questions to answer in your notes:** What is the handshake? Why 101? What does Socket.IO add that raw `ws` lacks?

### Day 2 - Read the server
Read `server/index.js` then `server/socket.js`. Try each in the browser:
- Change `io.emit` to `socket.broadcast.emit` in `chat:send` and see why the sender no longer sees their own message.
- Change it to `socket.emit` and see who receives it.

### Day 3 - Read the client
Read `client/src/ChatRoom.jsx`:
- Comment out the cleanup (`socket.off`) and trigger a re-render. Watch duplicated messages.
- Stop the server while the page is open. Watch the red dot, then restart it and watch auto-reconnect.

### Day 4-5 - Extend it (exercises)
1. Show a "Connection lost" banner instead of just the dot.
2. Add a `chat:send` **acknowledgement**: `socket.emit("chat:send", text, (res) => ...)` and show a failed-send state.
3. Add a `/me` command (e.g. `/me waves` -> "* Sam waves").
4. Add a "Clear my screen" button (client-only).
5. Reject duplicate usernames on `user:join` (use the ack callback).

### Day 6-7 - Review
Explain out loud, without notes: connection lifecycle, `emit` vs `broadcast` vs `io.emit`, why listeners need cleanup, why history is REST and live updates are WebSocket.

## Known Level 1 limitations (fixed in Level 2/3)
- No real authentication: anyone can claim any username.
- No input validation beyond length, no rate limiting.
- One global room only.
- Online users stored in server memory (lost on restart, breaks with multiple servers).
