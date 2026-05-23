import { useParams } from "react-router-dom";
import axios from "axios";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import socket from "../utils/socket";
import { API_URL } from "../config";

function Join() {
  const { roomCode } = useParams();

  const [joined, setJoined] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    socket.on("users-count", (count) => {
      setUsersCount(count);
    });

    socket.on("new-file", (fileData) => {
      setFiles((prev) => [fileData, ...prev]);
    });

    return () => {
      socket.off("users-count");
      socket.off("new-file");
    };
  }, []);

  const joinRoom = async () => {
    try {
      await axios.post(`${API_URL}/join-room`, {
        roomCode,
      });

      socket.emit("join-room", roomCode);

      setJoined(true);
    } catch (error) {
      console.error(error);
      alert("Room not found or expired");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(0);

      await axios.post(
        `${API_URL}/upload/${roomCode}`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );

            setUploadProgress(percent);
          },
        }
      );
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex justify-center items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md text-white"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">PeerDrop 360</h1>
          <p className="text-gray-300 mt-2">Group File Sharing</p>
        </div>

        <div className="text-center mb-6">
          <div className="text-gray-300">Room Code</div>
          <div className="text-4xl font-bold mt-2 text-cyan-300 tracking-widest">
            {roomCode}
          </div>
        </div>

        {!joined && (
          <button
            onClick={joinRoom}
            className="w-full bg-cyan-500 hover:bg-cyan-600 transition text-white font-bold py-4 rounded-2xl"
          >
            Join Session
          </button>
        )}

        {joined && (
          <>
            <div className="text-center mb-6">
              Users Connected: {usersCount}
            </div>

            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-cyan-400 rounded-2xl p-8 text-center hover:bg-white/10 transition">
                Upload File
              </div>

              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {uploadProgress > 0 && (
              <div className="mt-6">
                Uploading: {uploadProgress}%
              </div>
            )}

            <div className="mt-8 space-y-4">
              {files.map((file, index) => (
                <a
                  key={index}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-white/10 p-4 rounded-2xl"
                >
                  📄 {file.fileName}
                </a>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default Join;