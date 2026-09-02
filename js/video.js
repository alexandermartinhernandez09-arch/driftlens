const VIDEO_TYPES = /^video\//i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
const MAX_VIDEO_FRAMES = 12;

function isVideoFile(file) {
  if (!file) return false;
  if (file.type && VIDEO_TYPES.test(file.type)) return true;
  return VIDEO_EXT.test(file.name || "");
}

function waitVideoEvent(target, name) {
  return new Promise((resolve, reject) => {
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("video load failed"));
    };
    const cleanup = () => {
      target.removeEventListener(name, onOk);
      target.removeEventListener("error", onErr);
    };
    target.addEventListener(name, onOk, { once: true });
    target.addEventListener("error", onErr, { once: true });
  });
}

async function extractVideoFrames(file, maxFrames) {
  maxFrames = maxFrames || MAX_VIDEO_FRAMES;
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await waitVideoEvent(video, "loadedmetadata");
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("invalid duration");
    }

    const count = Math.min(maxFrames, Math.max(4, Math.round(duration * 2)));
    const base = (file.name || "video").replace(/\.[^.]+$/, "");
    const files = [];

    for (let i = 0; i < count; i++) {
      const t = (duration * (i + 0.5)) / count;
      video.currentTime = Math.min(Math.max(t, 0), Math.max(duration - 0.05, 0));
      await waitVideoEvent(video, "seeked");

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("toBlob failed"))), "image/png");
      });

      files.push(new File([blob], `${base}-f${String(i + 1).padStart(2, "0")}.png`, { type: "image/png" }));
    }

    return files;
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}
