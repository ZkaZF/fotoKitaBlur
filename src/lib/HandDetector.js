/**
 * HandDetector — MediaPipe Hands wrapper for peace sign (✌️) detection.
 *
 * Dual-strategy detection:
 * - Back-of-hand: 3D distance ratio method (very accurate)
 * - Palm-facing:  2D wrist-distance method (avoids noisy z-values)
 * - Auto-detects hand orientation and picks the right strategy
 */

let HandLandmarker;
let FilesetResolver;

async function loadMediaPipe() {
  if (HandLandmarker && FilesetResolver) return;
  const vision = await import('@mediapipe/tasks-vision');
  HandLandmarker = vision.HandLandmarker;
  FilesetResolver = vision.FilesetResolver;
}

export async function createHandDetector() {
  await loadMediaPipe();

  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.35,
    minHandPresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
  });

  return handLandmarker;
}

// ── Distance helpers ──

/** 2D Euclidean distance (ignores z — stable for palm-facing) */
function dist2D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 3D Euclidean distance (uses z — accurate for back-of-hand) */
function dist3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ── Hand orientation detection ──

/**
 * Detect if palm is facing the camera.
 *
 * When palm faces camera: MCP knuckles (5,9,13,17) are closer to camera
 * (smaller z) than the wrist (0). When back of hand faces camera, it's reversed.
 */
function isPalmFacing(lm) {
  const wristZ = lm[0].z || 0;
  const mcpAvgZ = ((lm[5].z || 0) + (lm[9].z || 0) + (lm[13].z || 0) + (lm[17].z || 0)) / 4;
  return mcpAvgZ < wristZ;
}

// ── Strategy 1: Back-of-hand (3D ratio method) ──

function isFingerExtended3D(lm, tip, pip, mcp) {
  const distTipMcp = dist3D(lm[tip], lm[mcp]);
  const distPipMcp = dist3D(lm[pip], lm[mcp]);
  if (distPipMcp < 0.001) return false;
  return (distTipMcp / distPipMcp) > 1.3;
}

function isFingerNotExtended3D(lm, tip, pip, mcp) {
  const distTipMcp = dist3D(lm[tip], lm[mcp]);
  const distPipMcp = dist3D(lm[pip], lm[mcp]);
  if (distPipMcp < 0.001) return true;
  return (distTipMcp / distPipMcp) < 1.7;
}

function isPeaceBackOfHand(lm) {
  const indexUp   = isFingerExtended3D(lm, 8,  6,  5);
  const middleUp  = isFingerExtended3D(lm, 12, 10, 9);
  const ringDown  = isFingerNotExtended3D(lm, 16, 14, 13);
  const pinkyDown = isFingerNotExtended3D(lm, 20, 18, 17);
  return indexUp && middleUp && ringDown && pinkyDown;
}

// ── Strategy 2: Palm-facing (2D wrist-distance method) ──
//
// When palm faces camera, z-values are noisy. Instead, we measure
// 2D distance from each fingertip to the wrist:
//   - Extended fingers (index, middle): tips are FAR from wrist
//   - Curled fingers (ring, pinky): tips are CLOSE to wrist
//
// This is naturally rotation-invariant and ignores z entirely.

function isPeacePalmFacing(lm) {
  const wrist = lm[0];
  const handSize = dist2D(lm[9], wrist); // wrist to middle MCP = reference size

  if (handSize < 0.01) return false; // hand too small/far

  // Normalize distances by hand size
  const indexDist  = dist2D(lm[8],  wrist) / handSize;
  const middleDist = dist2D(lm[12], wrist) / handSize;
  const ringDist   = dist2D(lm[16], wrist) / handSize;
  const pinkyDist  = dist2D(lm[20], wrist) / handSize;

  // Extended fingers should be >1.8x hand size from wrist
  // Curled fingers should be <1.8x hand size from wrist
  const extendedMin = 1.6;
  const curledMax   = 1.9;

  const indexOut  = indexDist  > extendedMin;
  const middleOut = middleDist > extendedMin;
  const ringIn    = ringDist   < curledMax;
  const pinkyIn   = pinkyDist  < curledMax;

  // Also: extended fingers should be noticeably further than curled ones
  const avgExtended = (indexDist + middleDist) / 2;
  const avgCurled   = (ringDist + pinkyDist) / 2;
  const spread      = avgExtended - avgCurled;

  return indexOut && middleOut && ringIn && pinkyIn && spread > 0.3;
}

// ── Combined detection ──

/**
 * Peace sign detection — auto-selects strategy based on hand orientation.
 *
 * @param {Array} landmarks - 21 landmark objects {x, y, z}
 * @returns {boolean}
 */
export function isPeaceSign(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  if (isPalmFacing(landmarks)) {
    return isPeacePalmFacing(landmarks);
  }
  return isPeaceBackOfHand(landmarks);
}

// ── Debounce state ──

let consecutivePeaceFrames = 0;
let consecutiveNonPeaceFrames = 0;
const PEACE_CONFIRM_FRAMES = 3;  // Anti false trigger
const PEACE_RELEASE_FRAMES = 6;  // ~200ms unblur delay

/**
 * Detect hands and check for peace signs, with debouncing.
 */
export function detectPeaceSign(handLandmarker, video, timestamp, currentState = false) {
  const result = { peaceDetected: currentState };

  if (!handLandmarker || !video || video.readyState < 2) {
    return result;
  }

  try {
    const detection = handLandmarker.detectForVideo(video, timestamp);
    let rawPeace = false;

    if (detection.landmarks && detection.landmarks.length > 0) {
      for (const landmarks of detection.landmarks) {
        if (isPeaceSign(landmarks)) {
          rawPeace = true;
          break;
        }
      }
    }

    if (rawPeace) {
      consecutivePeaceFrames++;
      consecutiveNonPeaceFrames = 0;
      if (consecutivePeaceFrames >= PEACE_CONFIRM_FRAMES) {
        result.peaceDetected = true;
      }
    } else {
      consecutiveNonPeaceFrames++;
      consecutivePeaceFrames = 0;
      if (consecutiveNonPeaceFrames >= PEACE_RELEASE_FRAMES) {
        result.peaceDetected = false;
      }
    }
  } catch (e) {
    console.warn('Hand detection frame error:', e.message);
  }

  return result;
}
