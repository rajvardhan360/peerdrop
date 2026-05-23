import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 gap-6">
      <h1 className="text-4xl font-bold">PeerDrop Session</h1>

      <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold">Room Code</h2>

        <div className="text-3xl font-bold text-blue-600">
          {roomCode}
        </div>

        <QRCodeCanvas value={joinLink} size={220} />

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
      </div>
    </div>
  );
}

export default Session;