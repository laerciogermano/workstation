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
export {
  createCdpSession,
  pickPage,
  openPage,
  getJson,
  ensureStandbyPage,
  closePageTarget,
} from './cdp.mjs';
export {
  applyFingerprint,
  chromeArgsFromFingerprint,
  normalizeFingerprint,
} from './fingerprint.mjs';
export {
  listFingerprintOptions,
  generateFingerprint,
  OS_PROFILES,
  CHROME_BUILDS,
  BR_LOCALES,
  HW_OPTS,
  MEM_OPTS,
  LANG_OPTS,
  FINGERPRINT_FIELDS,
} from './fingerprint-catalog.mjs';
export {
  applyCameraSpoof,
  cameraSpoofExpression,
  DEFAULT_LABEL as CAMERA_SPOOF_LABEL,
} from './camera-spoof.mjs';
export {
  cameraFromFingerprint,
  convertToY4m,
  DEFAULT_CAMERA_LABEL,
  ensureCaptureFile,
  fakeCameraChromeArgs,
  stripFakeCameraArgs,
} from './camera.mjs';
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
  getCamera,
  setCamera,
  clearCamera,
  applySelectedMedia,
  ensureFingerprintKeeper,
  scriptsDir,
  profilesDir,
  expandHome,
  resolveStartScript,
  isPortListening,
} from './registry.mjs';
export {
  mediaDir,
  listMedia,
  getMedia,
  addMedia,
  addMediaFromUpload,
  removeMedia,
  getSelectedMedia,
  selectMediaForCdp,
} from './media.mjs';
export {
  snapshotsDir,
  listSnapshots,
  getSelectedSnapshot,
  createSnapshot,
  selectSnapshot,
  removeSnapshot,
  restoreSnapshot,
  restoreSelectedBeforeStart,
  backupsDir,
  listBackups,
  getSelectedBackup,
  createBackup,
  selectBackup,
  removeBackup,
  restoreBackup,
} from './snapshot.mjs';
export {
  viewRoot,
  getViewConfig,
  setViewConfig,
  startView,
  stopView,
  readLatestFrame,
  clearViewFrames,
} from './view.mjs';
