export { connect, HumanCdpSession } from './session.mjs';
export {
  sleep,
  rand,
  randInt,
  trajectoryPoints,
  pathToTarget,
  densify,
  moveAlong,
  pressRelease,
} from './human.mjs';
export { createCdpSession, pickPage, openPage, getJson } from './cdp.mjs';
export {
  applyFingerprint,
  chromeArgsFromFingerprint,
  normalizeFingerprint,
} from './fingerprint.mjs';
export {
  applyCameraSpoof,
  cameraSpoofExpression,
  DEFAULT_LABEL as CAMERA_SPOOF_LABEL,
} from './camera-spoof.mjs';
export {
  captureScreenshot,
  ocrFromSession,
  ocrImage,
  findOcrWord,
} from './ocr.mjs';
export {
  listCdps,
  getCdp,
  createCdp,
  updateCdp,
  removeCdp,
  statusCdp,
  startCdp,
  stopCdp,
  connectCdp,
  ensureFingerprintKeeper,
  scriptsDir,
  profilesDir,
  expandHome,
  resolveStartScript,
  isPortListening,
} from './registry.mjs';
