const FACE = {
  detector: null,
  loading: null,
  lastError: null
};

function cropFaceSample(bitmap, box, size) {
  const pad = 0.12;
  const x = Math.max(0, Math.floor((box.x - box.w * pad) * bitmap.width));
  const y = Math.max(0, Math.floor((box.y - box.h * pad) * bitmap.height));
  const w = Math.min(bitmap.width - x, Math.ceil(box.w * (1 + pad * 2) * bitmap.width));
  const h = Math.min(bitmap.height - y, Math.ceil(box.h * (1 + pad * 2) * bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  canvas.getContext("2d").drawImage(bitmap, x, y, w, h, 0, 0, w, h);
  const scaled = document.createElement("canvas");
  scaled.width = size;
  scaled.height = size;
  const ctx = scaled.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / w, size / h);
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));
  ctx.drawImage(canvas, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return ctx.getImageData(0, 0, size, size).data;
}

function pickLargestFace(detections, width, height) {
  if (!detections || !detections.length) return null;
  let best = null;
  let bestArea = 0;
  detections.forEach((det) => {
    const box = det.boundingBox;
    if (!box) return;
    const area = box.width * box.height;
    if (area > bestArea) {
      bestArea = area;
      best = {
        x: box.originX / width,
        y: box.originY / height,
        w: box.width / width,
        h: box.height / height
      };
    }
  });
  return best;
}

async function ensureFaceDetector() {
  if (FACE.detector) return FACE.detector;
  if (FACE.loading) return FACE.loading;

  FACE.loading = (async () => {
    const mod = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm");
    const { FaceDetector, FilesetResolver } = mod;
    const wasm = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
    const fileset = await FilesetResolver.forVisionTasks(wasm);
    FACE.detector = await FaceDetector.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU"
      },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.45
    });
    FACE.lastError = null;
    return FACE.detector;
  })().catch((err) => {
    FACE.lastError = err;
    FACE.loading = null;
    throw err;
  });

  return FACE.loading;
}

async function detectFaceOnBitmap(bitmap) {
  const detector = await ensureFaceDetector();
  const result = detector.detect(bitmap);
  return pickLargestFace(result.detections, bitmap.width, bitmap.height);
}

async function enrichFaceData(item, bitmap) {
  try {
    const box = await detectFaceOnBitmap(bitmap);
    if (!box) {
      item.faceBox = null;
      item.faceSample = null;
      return item;
    }
    item.faceBox = box;
    item.faceSample = cropFaceSample(bitmap, box, SAMPLE);
    return item;
  } catch {
    item.faceBox = null;
    item.faceSample = null;
    item.faceError = true;
    return item;
  }
}

function compareFaceGate(anchor, item, limits, t) {
  if (!anchor.faceSample && !item.faceSample) return null;

  if (anchor.faceBox && !item.faceBox) {
    return {
      gate: gate("face", "WARN", t.gateFace, t.faceMissing, "—"),
      facePx: null
    };
  }

  if (!anchor.faceSample || !item.faceSample) {
    return {
      gate: gate("face", "PASS", t.gateFace, t.faceOff, "—"),
      facePx: null
    };
  }

  const facePx = pixelDelta(anchor.faceSample, item.faceSample);
  const faceWarn = limits.faceWarn != null ? limits.faceWarn : 0.08;
  const status = facePx != null && facePx >= faceWarn ? "WARN" : "PASS";
  return {
    gate: gate(
      "face",
      status,
      t.gateFace,
      status === "WARN" ? t.faceWarn : t.faceOk,
      facePx == null ? "—" : `${(facePx * 100).toFixed(1)} %`
    ),
    facePx
  };
}
