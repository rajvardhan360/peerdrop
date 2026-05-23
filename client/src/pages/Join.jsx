import { useParams } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import socket from "../utils/socket";
import { API_URL } from "../config";
import {
  createPeerConnection,
  createOffer,
  handleOffer,
  handleAnswer,
  handleIceCandidate,
  sendFile,
} from "../utils/webrtc";

function Join() {
  const { roomCode } = useParams();

  const [joined, setJoined] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [receivedFile, setReceivedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const joinRoom = async () => {
    try {
      await axios.post(`${API_URL}/join-room`, {
        roomCode,
      });

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

      setJoined(true);
    } catch {
      alert("Room not found");
    }
  };

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 gap-4">
      <h1 className="text-4xl font-bold">Join PeerDrop</h1>

      <div className="text-2xl font-semibold">
        Room: {roomCode}
      </div>

      <button
        onClick={joinRoom}
        className="bg-green-500 text-white px-6 py-3 rounded-xl"
      >
        Join Session
      </button>

      {joined && (
        <>
          <div className="text-blue-600 text-xl">
            Connected Successfully
          </div>

          <div className="text-xl">
            Users Connected: {usersCount}
          </div>

          <input
            type="file"
            onChange={handleFileChange}
            className="border p-2"
          />

          {uploadProgress > 0 && (
            <div className="text-blue-600 font-semibold">
              Uploading: {uploadProgress}%
            </div>
          )}

          {downloadProgress > 0 && (
            <div className="text-purple-600 font-semibold">
              Downloading: {downloadProgress}%
            </div>
          )}

          {receivedFile && (
            <a
              href={receivedFile.url}
              download={receivedFile.fileName}
              className="bg-green-500 text-white px-6 py-3 rounded-xl"
            >
              Download {receivedFile.fileName}
            </a>
          )}
        </>
      )}
    </div>
  );
}

export default Join;