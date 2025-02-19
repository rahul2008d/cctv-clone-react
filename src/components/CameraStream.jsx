import { useEffect, useRef, useState } from "react";

const CameraStream = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [motionDetected, setMotionDetected] = useState(false);

  useEffect(() => {
    // Access the webcam and set video stream
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play(); // Ensure video starts playing
        }
      })
      .catch((err) => console.error("Error accessing camera: ", err));

    // Connect to WebSocket server
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/stream");

    ws.onopen = () => {
      console.log("WebSocket Connected");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      if (event.data === "motion_detected") {
        setMotionDetected(true);
        setTimeout(() => setMotionDetected(false), 2000); // Reset after 2 sec
      }
    };

    ws.onerror = (error) => console.error("WebSocket Error: ", error);

    ws.onclose = () => {
      console.log("WebSocket Closed");
      setSocket(null); // Reset socket state
    };

    return () => {
      if (ws) {
        ws.close(); // Cleanup WebSocket on unmount
      }
    };
  }, []);

  useEffect(() => {
    const sendFrames = () => {
      if (!videoRef.current || !canvasRef.current || !socket) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Ensure canvas size matches video feed
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw video frame onto canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas image to base64
      const frameData = canvas.toDataURL("image/jpeg");
      socket.send(frameData);

      setTimeout(sendFrames, 200); // Send frames every 100ms
    };

    if (socket) {
      sendFrames();
    }
  }, [socket]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-700 text-white p-4">
      {/* Header with Glow Effect */}
      <h1 className="text-xl md:text-2xl font-extrabold mb-6 text-center neon-text">
        🔴 Real-time CCTV Feed
      </h1>

      {/* Video Container */}
      <div className="relative w-full max-w-2xl border-4 border-gray-700 rounded-xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-auto rounded-xl"
        />
        {/* Motion Alert with Animation */}
        {motionDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 animate-pulse text-red-200 text-2xl md:text-3xl font-extrabold tracking-wider">
            🚨 Motion Detected!
          </div>
        )}
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Add Some Glow Effect */}
      <style>
        {`
      .neon-text {
        text-shadow: 0 0 10px rgba(12, 18, 24, 0.8);
      }
    `}
      </style>
    </div>
  );
};

export default CameraStream;
