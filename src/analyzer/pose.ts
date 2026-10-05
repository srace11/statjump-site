// On-device pose detection with MediaPipe. The model file is served from this
// site and checked against a pinned hash, so results can't change under us
// when Google publishes a new model.

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export const POSE_MODEL = {
  name: 'pose_landmarker_full (float16, v1)',
  url: '/models/pose_landmarker_full.task',
  sha256: '5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1',
};
/** Must match the exact version pinned in package.json (checked by a test). */
export const MEDIAPIPE_VERSION = '1.0.1';

export async function sha256Hex(data: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createPoseLandmarker(): Promise<PoseLandmarker> {
  const res = await fetch(POSE_MODEL.url);
  if (!res.ok) throw new Error(`Couldn't load the pose model (${res.status}).`);
  const model = new Uint8Array(await res.arrayBuffer());
  if ((await sha256Hex(model)) !== POSE_MODEL.sha256) {
    throw new Error('The pose model file does not match the pinned version.');
  }
  const fileset = await FilesetResolver.forVisionTasks('/mediapipe');
  return PoseLandmarker.createFromOptions(fileset, {
    // CPU gives the same output run after run; GPU results can vary slightly.
    baseOptions: { modelAssetBuffer: model, delegate: 'CPU' },
    runningMode: 'VIDEO',
    numPoses: 3,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

/** Skeleton lines for drawing, as landmark index pairs. */
export const POSE_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS.map((c) => [c.start, c.end] as const);
