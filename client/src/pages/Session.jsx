import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
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

function Session({ roomCode }) {
  const joinLink = `${APP_URL}/join/${roomCode}`;

  const [usersCount, setUsersCount] = useState(0);
  const [receivedFile, setReceivedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
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
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-10 w-full max-w-xl text-white"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">PeerDrop</h1>
            <p className="text-gray-300 mt-2">
              Global Browser File Transfer
            </p>
          </div>

          <div className="bg-green-500/20 border border-green-400 px-4 py-2 rounded-full text-green-300 font-semibold">
            Connected
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl text-gray-300">Room Code</h2>
          <div className="text-5xl font-bold mt-3 tracking-widest text-cyan-300">
            {roomCode}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white p-4 rounded-2xl">
            <QRCodeCanvas value={joinLink} size={220} />
          </div>
        </div>

        <div className="text-center text-lg mb-6">
          Users Connected:{" "}
          <span className="font-bold text-cyan-300">
            {usersCount}
          </span>
        </div>

        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-cyan-400 rounded-2xl p-8 text-center hover:bg-white/10 transition">
            <div className="text-2xl mb-2">📁</div>
            <div className="text-lg font-semibold">
              Click to Upload File
            </div>
            <div className="text-sm text-gray-300 mt-2">
              PDF, Images, Videos, ZIP, Docs
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
                className="bg-cyan-400 h-4 rounded-full transition-all"
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
                className="bg-purple-400 h-4 rounded-full transition-all"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {receivedFile && (
          <a
            href={receivedFile.url}
            download={receivedFile.fileName}
            className="block mt-8 bg-green-500 hover:bg-green-600 transition text-center text-white font-bold py-4 rounded-2xl"
          >
            Download {receivedFile.fileName}
          </a>
        )}
      </motion.div>
    </div>
  );
}

export default Session;