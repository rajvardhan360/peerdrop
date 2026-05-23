import { useState } from "react";
import axios from "axios";
import Session from "./Session";
import { API_URL } from "../config";

function Home() {
  const [roomCode, setRoomCode] = useState("");
  const [createdRoom, setCreatedRoom] = useState("");

  const createRoom = async () => {
    try {
      const res = await axios.post(`${API_URL}/create-room`);
      setCreatedRoom(res.data.roomCode);
    } catch {
      alert("Server error");
    }
  };

  const joinRoom = async () => {
    try {
      const res = await axios.post(`${API_URL}/join-room`, {
        roomCode,
      });

      alert(res.data.message);
    } catch {
      alert("Room not found");
    }
  };

  if (createdRoom) {
    return <Session roomCode={createdRoom} />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4 bg-gray-100">
      <h1 className="text-4xl font-bold">PeerDrop</h1>

      <button
        onClick={createRoom}
        className="bg-blue-500 text-white px-6 py-3 rounded-xl"
      >
        Create Session
      </button>

      <input
        type="text"
        placeholder="Enter Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        className="border p-3 rounded-xl"
      />

      <button
        onClick={joinRoom}
        className="bg-green-500 text-white px-6 py-3 rounded-xl"
      >
        Join Session
      </button>
    </div>
  );
}

export default Home;