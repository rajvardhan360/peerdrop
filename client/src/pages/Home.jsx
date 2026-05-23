import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function Home() {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const createRoom = async () => {
    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/create-room`);

      navigate(`/session/${res.data.roomCode}`);
    } catch (error) {
      console.error(error);
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

      navigate(`/join/${roomCode}`);
    } catch (error) {
      console.error(error);
      alert("Room not found or expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex justify-center items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-md text-white"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">PeerDrop 360</h1>
          <p className="text-gray-300 mt-3">
            Fast browser-based global file transfer
          </p>
        </div>

        <div className="space-y-5">
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 transition py-4 rounded-2xl font-semibold"
          >
            {loading ? "Creating..." : "Create Session"}
          </button>

          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value.toUpperCase())
            }
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white placeholder-gray-400 outline-none focus:border-cyan-400"
          />

          <button
            onClick={joinRoom}
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 transition py-4 rounded-2xl font-semibold"
          >
            {loading ? "Joining..." : "Join Session"}
          </button>
        </div>

        <div className="flex justify-center gap-4 mt-8 text-sm text-gray-300">
          <span>🌍 Global</span>
          <span>⚡ Fast</span>
          <span>🔒 Secure</span>
        </div>
      </motion.div>
    </div>
  );
}

export default Home;