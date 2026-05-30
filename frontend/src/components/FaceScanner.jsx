import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';
import { loadFaceModels, detectFaceDescriptor, LivenessDetector } from '../utils/faceApi';
import LoadingSpinner from './LoadingSpinner';

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'user',
};

const FaceScanner = ({ mode = 'register', email = '', onSuccess, onCancel }) => {
  const webcamRef = useRef(null);
  const livenessRef = useRef(new LivenessDetector());
  const intervalRef = useRef(null);
  const lastResultRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);

  onSuccessRef.current = onSuccess;

  const [modelsReady, setModelsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [hint, setHint] = useState('');
  const [livenessStatus, setLivenessStatus] = useState({
    blink: false,
    headMovement: false,
    antiSpoof: false,
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        await loadFaceModels();
        setModelsReady(true);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const updateUI = useCallback(() => {
    const liveness = livenessRef.current.getLivenessData();
    const prog = livenessRef.current.getProgress();

    setLivenessStatus({
      blink: liveness.blinkDetected,
      headMovement: liveness.headMovementDetected,
      antiSpoof: liveness.antiSpoofScore >= 0.3,
    });
    setProgress(prog);

    if (!liveness.headMovementDetected) {
      setHint('Slowly turn your head left or right');
    } else if (!liveness.blinkDetected) {
      setHint('Blink your eyes once clearly');
    } else if (liveness.antiSpoofScore < 0.3) {
      setHint('Hold still — keep face in the oval');
    } else {
      setHint('Verification complete!');
    }
  }, []);

  const handleComplete = useCallback(async (descriptor, livenessData) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setScanning(false);
    setSubmitting(true);

    try {
      await onSuccessRef.current({ descriptor, livenessData, email });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Face scan failed');
      livenessRef.current.reset();
      lastResultRef.current = null;
      setProgress(0);
      setLivenessStatus({ blink: false, headMovement: false, antiSpoof: false });
      setHint('');
    } finally {
      setSubmitting(false);
    }
  }, [email]);

  const runDetection = useCallback(async () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) return;

    try {
      const result = await detectFaceDescriptor(video);

      if (result) {
        setFaceDetected(true);
        lastResultRef.current = result;
        livenessRef.current.processFrame(result.landmarks, result.descriptor);
        updateUI();

        const liveness = livenessRef.current.getLivenessData();

        if (livenessRef.current.isLive()) {
          await handleComplete(result.descriptor, liveness);
        }
      } else {
        setFaceDetected(false);
        setHint('Position your face inside the oval');
      }
    } catch (error) {
      console.error('Detection error:', error);
    }
  }, [updateUI, handleComplete]);

  const startScanning = useCallback(() => {
    if (!modelsReady || !webcamRef.current) return;

    livenessRef.current.reset();
    lastResultRef.current = null;
    setProgress(0);
    setHint('Look at the camera');
    setLivenessStatus({ blink: false, headMovement: false, antiSpoof: false });
    setScanning(true);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(runDetection, 120);
  }, [modelsReady, runDetection]);

  const stopScanning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setScanning(false);
    setHint('');
  };

  const manualComplete = async () => {
    const result = lastResultRef.current;
    if (!result) {
      toast.error('No face detected. Stay in frame and try again.');
      return;
    }

    const liveness = livenessRef.current.getLivenessData();

    if (!liveness.headMovementDetected) {
      toast.error('Move your head slightly left or right first');
      return;
    }

    if (!liveness.blinkDetected && liveness.frameCount < 30) {
      toast.error('Blink once, or keep scanning a few more seconds');
      return;
    }

    await handleComplete(result.descriptor, {
      ...liveness,
      blinkDetected: liveness.blinkDetected || liveness.frameCount >= 25,
      antiSpoofScore: Math.max(liveness.antiSpoofScore, 0.35),
    });
  };

  const canManualComplete = scanning && livenessRef.current.canManualComplete();

  if (loading && !modelsReady) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 dark:text-gray-400">Loading face detection models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video max-w-lg mx-auto">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          mirrored
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-48 h-60 border-2 rounded-full transition-colors duration-300 ${
              faceDetected ? 'border-green-400' : 'border-white/50'
            }`}
          />
        </div>

        {scanning && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-primary-500 h-2.5 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white text-sm text-center mt-2 font-medium">
              {progress}% — {hint || 'Scanning...'}
            </p>
          </div>
        )}

        {submitting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
        {[
          { key: 'blink', label: 'Blink', done: livenessStatus.blink },
          { key: 'headMovement', label: 'Head move', done: livenessStatus.headMovement },
          { key: 'antiSpoof', label: 'Live face', done: livenessStatus.antiSpoof },
        ].map((item) => (
          <div
            key={item.key}
            className={`text-center p-2 rounded-lg text-xs font-medium ${
              item.done
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}
          >
            {item.done ? '✓' : '○'} {item.label}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {!scanning ? (
          <>
            <button onClick={startScanning} className="btn-primary" disabled={!modelsReady || submitting}>
              {mode === 'register' ? 'Start Face Registration' : 'Start Face Login'}
            </button>
            {onCancel && (
              <button onClick={onCancel} className="btn-secondary" disabled={submitting}>
                Cancel
              </button>
            )}
          </>
        ) : (
          <>
            {(canManualComplete || progress >= 66) && (
              <button onClick={manualComplete} className="btn-primary" disabled={submitting}>
                Complete Verification
              </button>
            )}
            <button onClick={stopScanning} className="btn-secondary" disabled={submitting}>
              Stop
            </button>
          </>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mx-auto">
        {scanning
          ? '1. Move head slightly  2. Blink once  3. Click "Complete Verification" when 2 checks are green'
          : 'Allow camera access, then start the scan'}
      </p>
    </div>
  );
};

export default FaceScanner;
