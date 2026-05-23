import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import socket from "../utils/socket";
import { APP_URL } from "../config";
import {
  createPeerConnection,
  createOffer,
  handleOffer,
  handleAnswer,
  handleIceCandidate,
  sendFile,
} from "../utils/webrtc";

function Session() {
  const { roomCode } = useParams();

  const joinLink = `${APP_URL}/join/${roomCode}`;

  const [usersCount, setUsersCount] = useState(0);
  const [receivedFile, setReceivedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (!roomCode) return;

    socket.emit("join-room", roomCode);

    createPeerConnection(
      socket,
      roomCode,
      () => {},
      (fileData) => {
        setReceivedFile(fileData);
      },
      (progress) => {
        setDownloadProgress(progress);
      }
    );

    socket.on("users-count", (count) => {
      setUsersCount(count);
    });

    socket.on("peer-joined", async () => {
      await createOffer(socket, roomCode);
    });

    socket.on("offer", async (offer) => {
      await handleOffer(
        socket,
        roomCode,
        offer,
        () => {},
        (fileData) => {
          setReceivedFile(fileData);
        },
        (progress) => {
          setDownloadProgress(progress);
        }
      );
    });

    socket.on("answer", async (answer) => {
      await handleAnswer(answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      await handleIceCandidate(candidate);
    });

    return () => {
      socket.off("users-count");
      socket.off("peer-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [roomCode]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      setUploadProgress(0);

      await sendFile(file, (progress) => {
        setUploadProgress(progress);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex justify-center items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-xl text-white"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">PeerDrop 360</h1>
            <p className="text-gray-300 mt-2">
              Share files instantly
            </p>
          </div>

          <div className="bg-green-500/20 border border-green-400 px-4 py-2 rounded-full text-green-300 font-semibold">
            Active
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-lg text-gray-300">Room Code</h2>
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
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {downloadProgress > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-purple-300 font-semibold">
              Downloading: {downloadProgress}%
            </div>

            <div className="w-full bg-white/20 rounded-full h-4">
              <div
                className="bg-purple-400 h-4 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {receivedFile && (
          <a
            href={receivedFile.url}
            download={receivedFile.fileName}
            className="block mt-8 bg-green-500 hover:bg-green-600 transition text-center py-4 rounded-2xl font-bold"
          >
            Download {receivedFile.fileName}
          </a>
        )}
      </motion.div>
    </div>
  );
}

export default Session;