// Copies MediaPipe's WebAssembly runtime from node_modules into public/mediapipe,
// so the analyzer loads the exact pinned version from this site instead of a CDN.
// Runs automatically before `npm run dev` and `npm run build`.
import { cpSync, mkdirSync } from 'node:fs';

const from = 'node_modules/@mediapipe/tasks-vision/wasm';
const to = 'public/mediapipe';
mkdirSync(to, { recursive: true });
for (const name of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  cpSync(`${from}/${name}`, `${to}/${name}`);
}
