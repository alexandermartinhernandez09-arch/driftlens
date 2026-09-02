const SAMPLE = 64;
const ANALYZE_MAX = 512;
const THUMB_MAX = 320;
const DISPLAY_MAX = 1024;
const IMAGE_TYPES = /^(image\/(jpeg|png|webp|gif|bmp)|)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;

function isImageFile(file) {
  if (!file) return false;
  if (file.type && IMAGE_TYPES.test(file.type) && file.type.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name || "");
}

function sampleCanvas(bitmap, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  return ctx.getImageData(0, 0, size, size);
}

function colorStats(imageData) {
  const { data } = imageData;
  let r = 0;
  let g = 0;
  let b = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  r /= count;
  g /= count;
  b /= count;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return { r, g, b, lum };
}

function readImageDimensions(buffer, mime, name) {
  if (!buffer || buffer.byteLength < 16) return null;
  const view = new DataView(buffer);

  if (view.getUint32(0) === 0x89504e47) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) {
    let offset = 2;
    while (offset + 9 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);
      const len = view.getUint16(offset + 2);
      if (len < 2) break;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
      }
      offset += 2 + len;
    }
  }

  if (view.byteLength >= 30 && view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250) {
    if (view.getUint32(12) === 0x56503858) {
      const w = 1 + (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16));
      const h = 1 + (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16));
      return { width: w, height: h };
    }
  }

  const type = mime || guessType(name || "");
  if (type === "image/gif" && view.getUint8(0) === 0x47 && view.getUint8(1) === 0x49) {
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  }

  return null;
}

async function decodeBitmapLimited(blob, maxSide) {
  try {
    return await createImageBitmap(blob, {
      resizeWidth: maxSide,
      resizeHeight: maxSide,
      resizeQuality: "medium"
    });
  } catch {
    return createImageBitmap(blob);
  }
}

async function bitmapToObjectUrl(bitmap, maxSide, mime, quality = 0.85) {
  const scale = Math.min(maxSide / bitmap.width, maxSide / bitmap.height, 1);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  const outMime = mime === "image/png" ? "image/png" : "image/jpeg";
  const outQuality = outMime === "image/png" ? undefined : quality;
  const outBlob = await canvasToBlob(canvas, outMime, outQuality);
  return URL.createObjectURL(outBlob);
}

async function analyzeFile(file, options) {
  options = options || {};
  const buffer = await file.arrayBuffer();
  const hash = await sha256Hex(buffer);
  const mime = file.type || guessType(file.name);
  const blob = new Blob([buffer], { type: mime || "application/octet-stream" });

  let dims = readImageDimensions(buffer, mime, file.name);
  const analyzeBitmap = await decodeBitmapLimited(blob, ANALYZE_MAX);
  if (!dims) {
    dims = { width: analyzeBitmap.width, height: analyzeBitmap.height };
  }

  const sample = sampleCanvas(analyzeBitmap, SAMPLE);
  const stats = colorStats(sample);
  const perceptual = enrichSample(sample.data, SAMPLE);

  const displayBitmap = await decodeBitmapLimited(blob, DISPLAY_MAX);
  const url = await bitmapToObjectUrl(displayBitmap, DISPLAY_MAX, mime, 0.88);
  const thumbUrl = await bitmapToObjectUrl(analyzeBitmap, THUMB_MAX, mime, 0.82);

  displayBitmap.close();

  const item = {
    id: `${hash}-${file.name}-${file.size}`,
    name: file.name,
    type: mime,
    size: file.size,
    width: dims.width,
    height: dims.height,
    aspect: dims.width / dims.height,
    hash,
    stats,
    sample: sample.data,
    dhash: perceptual.dhash,
    zones: perceptual.zones,
    center: perceptual.center,
    histogram: perceptual.histogram,
    url,
    thumbUrl,
    faceBox: null,
    faceSample: null,
    fromVideo: !!options.fromVideo
  };

  if (options.faceGate) {
    try {
      await enrichFaceData(item, analyzeBitmap);
    } finally {
      analyzeBitmap.close();
    }
  } else {
    analyzeBitmap.close();
  }

  return item;
}

function guessType(name) {
  const lower = (name || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  return "image/jpeg";
}

async function canvasToBlob(canvas, mime = "image/png", quality = 0.92) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
  if (blob) return blob;
  const dataUrl = canvas.toDataURL(mime, quality);
  const res = await fetch(dataUrl);
  return await res.blob();
}

async function analyzeFromImage(img, name, options) {
  options = options || {};
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img, 0, 0);
  const mime = guessType(name);
  const blob = await canvasToBlob(canvas, mime);
  const file = new File([blob], name, { type: mime });
  return analyzeFile(file, options);
}

async function collectDroppedFiles(dataTransfer) {
  const items = [...(dataTransfer.items || [])];
  if (!items.length) return [...(dataTransfer.files || [])];

  const files = [];
  const walkers = items.map((item) => {
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    if (entry) return walkEntry(entry, files);
    const file = item.getAsFile();
    if (file) files.push(file);
    return Promise.resolve();
  });
  await Promise.all(walkers);
  return files;
}

function walkEntry(entry, files) {
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      entry.file((file) => {
        files.push(file);
        resolve();
      }, reject);
    });
  }
  if (!entry.isDirectory) return Promise.resolve();
  const reader = entry.createReader();
  return readAll(reader).then((entries) =>
    Promise.all(entries.map((child) => walkEntry(child, files)))
  );
}

function readAll(reader) {
  return new Promise((resolve, reject) => {
    const all = [];
    const next = () => {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(all);
          return;
        }
        all.push(...batch);
        next();
      }, reject);
    };
    next();
  });
}

function revokeItemUrls(item) {
  if (!item) return;
  if (item.url) URL.revokeObjectURL(item.url);
  if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
}
