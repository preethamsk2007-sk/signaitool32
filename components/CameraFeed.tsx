
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
  const [error, setError] = useState<{ title: string; message: string; type: 'permission' | 'security' | 'other' } | null>(null);
  const handsRef = useRef<any>(null);

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (typeof Hands !== 'undefined') {
      const hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
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
          }
        }
        canvasCtx.restore();
      });

      handsRef.current = hands;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);

    // Specific check for Secure Context (HTTPS)
    // Modern browsers disable mediaDevices.getUserMedia on non-localhost HTTP origins.
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !isLocalhost) {
      setError({
        title: "Connection Not Secure",
        message: "Browser security policies prevent camera access on insecure (HTTP) websites. Please use an HTTPS connection or test on localhost to enable the sign language interpreter.",
        type: 'security'
      });
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError({
        title: "Feature Not Supported",
        message: "Your browser does not support camera access or the MediaDevices API. Try using the latest version of Chrome, Edge, or Safari.",
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
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({
          title: "Access Denied",
          message: "You have blocked camera access. Please update your browser settings for this site and refresh.",
          type: 'permission'
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError({
          title: "No Camera Detected",
          message: "We couldn't find a camera on your device. Please connect one and try again.",
          type: 'other'
        });
      } else {
        setError({
          title: "Unexpected Camera Error",
          message: err.message || "An unknown error occurred while trying to access the camera.",
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

  useEffect(() => {
    let intervalId: number;
    if (isCapturing && !isProcessing && isCameraOn && !error) {
      intervalId = window.setInterval(() => {
        captureFrame();
      }, 2000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isCapturing, isProcessing, isCameraOn, error]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn || error) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    
    const targetHeight = 720;
    const scale = targetHeight / videoRef.current.videoHeight;
    canvasRef.current.width = videoRef.current.videoWidth * scale;
    canvasRef.current.height = targetHeight;
    
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.85).split(',')[1];
    onCapture(base64Image);
  };

  return (
    <div className="relative group">
      <div className={`absolute -inset-1 bg-gradient-to-r ${isCameraOn ? 'from-indigo-500 to-sky-500' : 'from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {!isCameraOn ? (
          <div className="aspect-video flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <p className="font-bold text-lg">Camera is Off</p>
          </div>
        ) : error ? (
          <div className="aspect-video flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/20 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${error.type === 'security' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{error.title}</h4>
            <p className="max-w-md text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium">{error.message}</p>
            {error.type !== 'security' && (
              <button onClick={startCamera} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95">
                Retry Access
              </button>
            )}
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
            {isProcessing && (
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-indigo-600/90 dark:bg-indigo-500/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-400/30">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-[10px] font-black uppercase tracking-wider">AI Thinking</span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className={`h-2 w-2 rounded-full ${isCapturing ? 'bg-red-500 animate-pulse' : 'bg-indigo-400'}`}></div>
              <span className="text-white text-[10px] font-black uppercase tracking-wider">
                {isCapturing ? 'Interpretation Live' : 'Camera Ready'}
              </span>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
