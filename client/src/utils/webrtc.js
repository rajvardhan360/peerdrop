let peerConnection = null;
let dataChannel = null;

const config = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "46d5957567ac9983a78cee74",
      credential: "1thlnT3YyzVJkMjx",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "46d5957567ac9983a78cee74",
      credential: "1thlnT3YyzVJkMjx",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "46d5957567ac9983a78cee74",
      credential: "1thlnT3YyzVJkMjx",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "46d5957567ac9983a78cee74",
      credential: "1thlnT3YyzVJkMjx",
    },
  ],
};

let receivedChunks = [];
let incomingFileName = "";
let incomingFileType = "";
let incomingFileSize = 0;
let receivedBytes = 0;

export function createPeerConnection(
  socket,
  roomCode,
  onMessage,
  onFileReceived,
  onProgress
) {
  peerConnection = new RTCPeerConnection(config);

  dataChannel = peerConnection.createDataChannel("fileTransfer");

  setupDataChannel(onMessage, onFileReceived, onProgress);

  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel(onMessage, onFileReceived, onProgress);
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

function setupDataChannel(onMessage, onFileReceived, onProgress) {
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
        incomingFileSize = data.fileSize;
        receivedChunks = [];
        receivedBytes = 0;
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
      receivedBytes += event.data.byteLength;

      const progress = Math.floor(
        (receivedBytes / incomingFileSize) * 100
      );

      onProgress(progress);
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
  onFileReceived,
  onProgress
) {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel(onMessage, onFileReceived, onProgress);
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
  try {
    await peerConnection.addIceCandidate(
      new RTCIceCandidate(candidate)
    );
  } catch (error) {
    console.error(error);
  }
}

export async function sendFile(file, onProgress) {
  if (!dataChannel || dataChannel.readyState !== "open") {
    alert("Connection not ready. Wait a few seconds.");
    return;
  }

  dataChannel.bufferedAmountLowThreshold = 65536;

  dataChannel.send(
    JSON.stringify({
      type: "file-info",
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    })
  );

  const chunkSize = 16000;
  let offset = 0;

  while (offset < file.size) {
    if (dataChannel.bufferedAmount > 1000000) {
      await new Promise((resolve) => {
        dataChannel.onbufferedamountlow = resolve;
      });
    }

    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();

    dataChannel.send(buffer);

    offset += chunkSize;

    const progress = Math.floor((offset / file.size) * 100);

    onProgress(progress);
  }

  dataChannel.send(
    JSON.stringify({
      type: "file-complete",
    })
  );
}