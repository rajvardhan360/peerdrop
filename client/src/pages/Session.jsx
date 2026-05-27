import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import socket from "../utils/socket";
import { APP_URL, API_URL } from "../config";

function Session() {
  const { roomCode } = useParams();

  const joinLink = `${APP_URL}/join/${roomCode}`;

  const [usersCount, setUsersCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    socket.emit("join-room", roomCode);

    socket.on("users-count", (count) => {
      setUsersCount(count);
    });

    socket.on("new-file", (fileData) => {
      setFiles((prev) => [fileData, ...prev]);
    });

    socket.on("room-history", (history) => {
      setFiles([...history].reverse());
    });

    return () => {
      socket.off("users-count");
      socket.off("new-file");
      socket.off("room-history");
    };
  }, [roomCode]);

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
            if (!progressEvent.total) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );

            setUploadProgress(percent);
          },
        }
      );

      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  const renderFile = (file, index) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
      file.fileName
    );

    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(
      file.fileName
    );

    const isPdf = /\.(pdf)$/i.test(file.fileName);

    const getFileIcon = () => {
      if (isPdf) return "📕";
      if (file.fileName.match(/\.(zip|rar|7z)$/i)) return "🗜️";
      if (file.fileName.match(/\.(doc|docx)$/i)) return "📘";
      if (file.fileName.match(/\.(xls|xlsx)$/i)) return "📗";
      if (file.fileName.match(/\.(ppt|pptx)$/i)) return "📙";
      return "📄";
    };

    return (
      <div
        key={index}
        className="bg-white/10 rounded-2xl overflow-hidden shadow-lg h-[320px] flex flex-col"
      >
        <div className="h-48 bg-black/20 flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="w-full h-full object-cover"
            />
          ) : isVideo ? (
            <video
              controls
              className="w-full h-full object-cover"
            >
              <source src={file.fileUrl} />
            </video>
          ) : (
            <div className="text-7xl">
              {getFileIcon()}
            </div>
          )}
        </div>

        <div className="p-3 flex-1">
          <div className="text-sm text-cyan-300 text-center break-words line-clamp-2">
            {file.fileName}
          </div>
        </div>

        <div className="p-3 flex gap-2">
          <a
            href={file.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white text-center py-2 rounded-xl font-semibold transition"
          >
            Open
          </a>

          <a
            href={file.fileUrl}
            download={file.fileName}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-center py-2 rounded-xl font-semibold transition"
          >
            Download
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex justify-center items-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-6xl text-white"
      >
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold">
                  PeerDrop 360
                </h1>
                <p className="text-gray-300 mt-2">
                  Group File Sharing
                </p>
              </div>

              <div className="bg-green-500/20 border border-green-400 px-4 py-2 rounded-full text-green-300 font-semibold">
                Active
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-lg text-gray-300">
                Room Code
              </h2>

              <div className="text-5xl font-bold mt-3 tracking-widest text-cyan-300">
                {roomCode}
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeCanvas value={joinLink} size={220} />
              </div>
            </div>

            <div className="text-center mb-6">
              Users Connected:{" "}
              <span className="font-bold text-cyan-300">
                {usersCount}
              </span>
            </div>

            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-cyan-400 rounded-2xl p-8 text-center hover:bg-white/10 transition">
                <div className="text-2xl mb-2">📁</div>
                <div className="text-lg font-semibold">
                  Upload File
                </div>
              </div>

              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {uploadProgress > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-cyan-300 font-semibold">
                  Uploading: {uploadProgress}%
                </div>

                <div className="w-full bg-white/20 rounded-full h-4">
                  <div
                    className="bg-cyan-400 h-4 rounded-full"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-2">
            {files.map(renderFile)}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Session;