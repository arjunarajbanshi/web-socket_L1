import { useState } from "react";

export default function JoinScreen({ onJoin }) {
  const [name, setName] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div className="center">
      <form className="card" onSubmit={submit}>
        <h1>SimpleChat</h1>
        <p className="muted">Pick a username to join the room.</p>
        <input
          autoFocus
          maxLength={30}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={!name.trim()}>
          Join chat
        </button>
      </form>
    </div>
  );
}
