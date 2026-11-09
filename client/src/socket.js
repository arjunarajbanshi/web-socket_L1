import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// One socket for the whole app, created ONCE at module level.
// autoConnect: false -> we connect manually when the user has entered a name.
export const socket = io(URL, { autoConnect: false });
