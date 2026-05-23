let peerConnection = null;
let dataChannel = null;

const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

let receivedChunks = [];
let incomingFileName = "";
let incomingFileType = "";

export function createPeerConnection(
  socket,
  roomCode,
  onMessage,
  onFileReceived
) {
  peerConnection = new RTCPeerConnection(config);

  dataChannel = peerConnection.createDataChannel("fileTransfer");

  setupDataChannel(onMessage, onFileReceived);

  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel(onMessage, onFileReceived);
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        roomCode,
        candidate: event.candidate,
      });
    }
  };

  return peerConnection;
}

function setupDataChannel(onMessage, onFileReceived) {
  dataChannel.onopen = () => {
    console.log("Data channel open");
  };

  dataChannel.onmessage = async (event) => {
    if (typeof event.data === "string") {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        onMessage(data.text);
      }

      if (data.type === "file-info") {
        incomingFileName = data.fileName;
        incomingFileType = data.fileType;
        receivedChunks = [];
      }

      if (data.type === "file-complete") {
        const blob = new Blob(receivedChunks, {
          type: incomingFileType,
        });

        const url = URL.createObjectURL(blob);

        onFileReceived({
          fileName: incomingFileName,
          url,
        });
      }
    } else {
      receivedChunks.push(event.data);
    }
  };
}

export async function createOffer(socket, roomCode) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", {
    roomCode,
    offer,
  });
}

export async function handleOffer(
  socket,
  roomCode,
  offer,
  onMessage,
  onFileReceived
) {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel(onMessage, onFileReceived);
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        roomCode,
        candidate: event.candidate,
      });
    }
  };

  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(offer)
  );

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", {
    roomCode,
    answer,
  });
}

export async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(answer)
  );
}

export async function handleIceCandidate(candidate) {
  await peerConnection.addIceCandidate(
    new RTCIceCandidate(candidate)
  );
}

export function sendMessage(message) {
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(
      JSON.stringify({
        type: "message",
        text: message,
      })
    );
  }
}

export async function sendFile(file) {
  if (!dataChannel || dataChannel.readyState !== "open") {
    alert("Connection not ready");
    return;
  }

  dataChannel.send(
    JSON.stringify({
      type: "file-info",
      fileName: file.name,
      fileType: file.type,
    })
  );

  const chunkSize = 16000;
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();

    dataChannel.send(buffer);

    offset += chunkSize;
  }

  dataChannel.send(
    JSON.stringify({
      type: "file-complete",
    })
  );
}