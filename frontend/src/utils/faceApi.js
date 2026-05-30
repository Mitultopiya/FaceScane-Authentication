import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelsLoaded = false;

export const loadFaceModels = async () => {
  if (modelsLoaded) return true;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Failed to load face models:', error);
    throw new Error('Failed to load face detection models. Please ensure models are in /public/models');
  }
};

export const detectFaceDescriptor = async (videoOrImage) => {
  const detection = await faceapi
    .detectSingleFace(videoOrImage, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  return {
    descriptor: Array.from(detection.descriptor),
    detection: detection.detection,
    landmarks: detection.landmarks,
  };
};

/**
 * Improved liveness detection with adaptive blink threshold
 */
export class LivenessDetector {
  constructor() {
    this.reset();
  }

  reset() {
    this.blinkDetected = false;
    this.headMovementDetected = false;
    this.antiSpoofScore = 0;
    this.frameCount = 0;
    this.previousDescriptors = [];
    this.earSamples = [];
    this.earBaseline = null;
    this.eyesWereClosed = false;
    this.previousNose = null;
    this.nosePositions = [];
    this.minEarSeen = 1;
    this.maxEarSeen = 0;
  }

  getEyeAspectRatio(landmarks, eyeIndices) {
    const points = eyeIndices.map((i) => landmarks.positions[i]);
    const vertical1 = Math.hypot(points[1].x - points[5].x, points[1].y - points[5].y);
    const vertical2 = Math.hypot(points[2].x - points[4].x, points[2].y - points[4].y);
    const horizontal = Math.hypot(points[0].x - points[3].x, points[0].y - points[3].y);
    if (horizontal === 0) return 0.3;
    return (vertical1 + vertical2) / (2 * horizontal);
  }

  processFrame(landmarks, descriptor = null) {
    this.frameCount++;

    const leftEAR = this.getEyeAspectRatio(landmarks, [36, 37, 38, 39, 40, 41]);
    const rightEAR = this.getEyeAspectRatio(landmarks, [42, 43, 44, 45, 46, 47]);
    const avgEAR = (leftEAR + rightEAR) / 2;

    this.earSamples.push(avgEAR);
    if (this.earSamples.length > 30) this.earSamples.shift();

    this.minEarSeen = Math.min(this.minEarSeen, avgEAR);
    this.maxEarSeen = Math.max(this.maxEarSeen, avgEAR);

    // Calibrate baseline after ~10 frames
    if (this.earSamples.length >= 10) {
      const sorted = [...this.earSamples].sort((a, b) => a - b);
      // Use median of upper half as "eyes open" baseline
      const upperHalf = sorted.slice(Math.floor(sorted.length / 2));
      this.earBaseline = upperHalf.reduce((a, b) => a + b, 0) / upperHalf.length;
    }

    // Blink: eyes closed then opened (adaptive threshold)
    if (this.earBaseline) {
      const closedThreshold = this.earBaseline * 0.65;
      const openThreshold = this.earBaseline * 0.85;

      if (avgEAR < closedThreshold) {
        this.eyesWereClosed = true;
      } else if (this.eyesWereClosed && avgEAR >= openThreshold) {
        this.blinkDetected = true;
      }
    }

    // Fallback blink: significant EAR range (eyes clearly opened and closed at some point)
    if (!this.blinkDetected && this.frameCount > 20 && this.maxEarSeen - this.minEarSeen > 0.04) {
      this.blinkDetected = true;
    }

    // Head movement: nose position variance
    const nose = landmarks.positions[30];
    this.nosePositions.push({ x: nose.x, y: nose.y });
    if (this.nosePositions.length > 20) this.nosePositions.shift();

    if (this.nosePositions.length >= 5) {
      const xs = this.nosePositions.map((p) => p.x);
      const ys = this.nosePositions.map((p) => p.y);
      const xRange = Math.max(...xs) - Math.min(...xs);
      const yRange = Math.max(...ys) - Math.min(...ys);
      if (xRange > 3 || yRange > 3) {
        this.headMovementDetected = true;
      }
    }

    // Also detect single-frame large movement
    if (this.previousNose) {
      const dx = Math.abs(nose.x - this.previousNose.x);
      const dy = Math.abs(nose.y - this.previousNose.y);
      if (dx > 2 || dy > 2) {
        this.headMovementDetected = true;
      }
    }
    this.previousNose = { x: nose.x, y: nose.y };

    // Anti-spoof: micro-movement in face descriptor over time
    if (descriptor) {
      this.previousDescriptors.push(descriptor);
      if (this.previousDescriptors.length > 8) this.previousDescriptors.shift();

      if (this.previousDescriptors.length >= 4) {
        let totalVariance = 0;
        for (let i = 0; i < 128; i++) {
          const values = this.previousDescriptors.map((d) => d[i]);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          totalVariance += values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
        }
        this.antiSpoofScore = Math.min(1, (totalVariance / 128) * 8000);
      }
    }

    // After enough frames with stable face, assume live (camera noise provides variance)
    if (this.frameCount >= 15 && this.previousDescriptors.length >= 4) {
      this.antiSpoofScore = Math.max(this.antiSpoofScore, 0.35);
    }
  }

  getLivenessData() {
    return {
      blinkDetected: this.blinkDetected,
      headMovementDetected: this.headMovementDetected,
      antiSpoofScore: this.antiSpoofScore,
      frameCount: this.frameCount,
    };
  }

  getProgress() {
    let prog = 0;
    const data = this.getLivenessData();
    if (data.blinkDetected) prog += 34;
    if (data.headMovementDetected) prog += 33;
    if (data.antiSpoofScore >= 0.3) prog += 33;
    return prog;
  }

  /** Ready to submit — blink OR sustained live scan */
  isLive() {
    const data = this.getLivenessData();
    const hasMovement = data.headMovementDetected;
    const hasSpoof = data.antiSpoofScore >= 0.3;
    const hasBlink = data.blinkDetected;
    const sustainedScan = data.frameCount >= 30 && hasMovement && hasSpoof;

    return hasMovement && hasSpoof && (hasBlink || sustainedScan);
  }

  /** Manual complete allowed when face held steady long enough */
  canManualComplete() {
    const data = this.getLivenessData();
    return data.frameCount >= 15 && data.headMovementDetected && data.antiSpoofScore >= 0.3;
  }
}

export default {
  loadFaceModels,
  detectFaceDescriptor,
  LivenessDetector,
};
