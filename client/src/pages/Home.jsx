import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "../config";

function Home() {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/create-room`);

      window.location.href = `/session/${res.data.roomCode}`;
    } catch {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      alert("Enter room code");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API_URL}/join-room`, {
        roomCode,
      });

      window.location.href = `/join/${roomCode}`;
    } catch {
      alert("Room not found or expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex justify-center items-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-10 w-full max-w-xl text-white"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight">
            PeerDrop 360
          </h1>

          <p className="text-gray-300 mt-4 text-lg">
            Global browser-based file transfer
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="bg-cyan-500/20 border border-cyan-400 text-cyan-300 px-4 py-2 rounded-full text-sm">
              WebRTC
            </span>

            <span className="bg-purple-500/20 border border-purple-400 text-purple-300 px-4 py-2 rounded-full text-sm">
              Secure Transfer
            </span>

            <span className="bg-green-500/20 border border-green-400 text-green-300 px-4 py-2 rounded-full text-sm">
              No Installation
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 transition text-white font-bold py-4 rounded-2xl shadow-lg"
          >
            {loading ? "Creating..." : "Create New Session"}
          </button>

          <div>
            <input
              type="text"
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase())
              }
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-gray-400 outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={joinRoom}
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 transition text-white font-bold py-4 rounded-2xl shadow-lg"
          >
            {loading ? "Joining..." : "Join Existing Session"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10 text-center">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-2xl mb-2">🌍</div>
            <div className="text-sm text-gray-300">
              Global Transfer
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm text-gray-300">
              Fast Transfer
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-sm text-gray-300">
              Secure
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Home;