
import React, { useRef, useEffect, useState, useCallback } from 'react';

// Declaring global variables for MediaPipe provided by scripts in index.html
declare var Hands: any;
declare var drawConnectors: any;
declare var drawLandmarks: any;
declare var HAND_CONNECTIONS: any;

interface CameraFeedProps {
  onCapture: (base64Image: string) => void;
  isProcessing: boolean;
  isCapturing: boolean;
  isCameraOn: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, isProcessing, isCapturing, isCameraOn }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<{ title: string; message: string; type: 'permission' | 'other' } | null>(null);
  const handsRef = useRef<any>(null);

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (typeof Hands !== 'undefined') {
      const hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0, // Lower complexity for faster tracking
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: any) => {
        if (!overlayRef.current || !videoRef.current) return;
        const canvasCtx = overlayRef.current.getContext('2d');
        if (!canvasCtx) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            if (typeof drawConnectors !== 'undefined' && typeof HAND_CONNECTIONS !== 'undefined') {
              drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: '#6366f1',
                lineWidth: 3,
              });
            }
            
            if (typeof drawLandmarks !== 'undefined') {
              drawLandmarks(canvasCtx, landmarks, {
                color: '#ffffff',
                lineWidth: 1,
                radius: 2,
              });
            }
            
            const xList = landmarks.map((l: any) => l.x);
            const yList = landmarks.map((l: any) => l.y);
            const minX = Math.min(...xList) * overlayRef.current.width;
            const maxX = Math.max(...xList) * overlayRef.current.width;
            const minY = Math.min(...yList) * overlayRef.current.height;
            const maxY = Math.max(...yList) * overlayRef.current.height;
            
            canvasCtx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            canvasCtx.lineWidth = 2;
            canvasCtx.setLineDash([4, 4]);
            canvasCtx.strokeRect(minX - 15, minY - 15, (maxX - minX) + 30, (maxY - minY) + 30);
          }
        }
        canvasCtx.restore();
      });

      handsRef.current = hands;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError({
        title: "Browser Not Supported",
        message: "Your browser doesn't support camera access or you are using an insecure connection.",
        type: 'other'
      });
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({
          title: "Permission Denied",
          message: "Camera access was blocked. Please allow camera access in your browser settings.",
          type: 'permission'
        });
      } else {
        setError({
          title: "Camera Error",
          message: err.message || "An unexpected error occurred.",
          type: 'other'
        });
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraOn]);

  useEffect(() => {
    let animationFrame: number;
    const processFrame = async () => {
      if (isCameraOn && videoRef.current && handsRef.current && videoRef.current.readyState === 4 && !error) {
        if (overlayRef.current) {
          overlayRef.current.width = videoRef.current.videoWidth;
          overlayRef.current.height = videoRef.current.videoHeight;
        }
        try {
          await handsRef.current.send({ image: videoRef.current });
        } catch (e) {
          console.error("Mediapipe processing error", e);
        }
      }
      animationFrame = requestAnimationFrame(processFrame);
    };
    processFrame();
    return () => cancelAnimationFrame(animationFrame);
  }, [isCameraOn, error]);

  // Reduced interval to 1.5 seconds for snappier experience
  useEffect(() => {
    let intervalId: number;
    if (isCapturing && !isProcessing && isCameraOn && !error) {
      intervalId = window.setInterval(() => {
        captureFrame();
      }, 1500);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isCapturing, isProcessing, isCameraOn, error]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn || error) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    
    // Downscale for faster API processing - 480p is plenty for sign recognition
    const targetHeight = 480;
    const scale = targetHeight / videoRef.current.videoHeight;
    canvasRef.current.width = videoRef.current.videoWidth * scale;
    canvasRef.current.height = targetHeight;
    
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.7).split(',')[1];
    onCapture(base64Image);
  };

  return (
    <div className="relative group">
      <div className={`absolute -inset-1 bg-gradient-to-r ${isCameraOn ? 'from-indigo-500 to-sky-500' : 'from-slate-200 to-slate-300'} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {!isCameraOn ? (
          <div className="aspect-video flex flex-col items-center justify-center bg-slate-100 text-slate-400">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <p className="font-bold text-lg">Camera is Powered Off</p>
          </div>
        ) : error ? (
          <div className="aspect-video flex flex-col items-center justify-center p-12 bg-slate-50 text-slate-600 text-center">
            <h4 className="text-xl font-black text-slate-900 mb-2">{error.title}</h4>
            <p className="max-w-md text-sm mb-6 leading-relaxed">{error.message}</p>
            <button onClick={startCamera} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Try Again</button>
          </div>
        ) : (
          <div className="relative aspect-video bg-black overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            
            {/* Minimal Processing Indicator */}
            {isProcessing && (
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-indigo-600/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-400/30 animate-in fade-in zoom-in duration-200">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-[10px] font-black uppercase tracking-wider">Analyzing</span>
              </div>
            )}
            
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className={`h-2 w-2 rounded-full ${isCapturing ? 'bg-red-500 animate-pulse' : 'bg-indigo-400'}`}></div>
              <span className="text-white text-[10px] font-black uppercase tracking-wider">
                {isCapturing ? 'Live Mode' : 'Ready'}
              </span>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
