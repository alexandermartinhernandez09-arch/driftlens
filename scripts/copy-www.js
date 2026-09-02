const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "www");

const files = [
  "index.html",
  "privacy.html",
  "manifest.webmanifest",
  "sw.js"
];

const dirs = ["css", "js", "assets"];

function rm(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function cpFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function cpDir(srcDir, destDir, skipMd = false) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) cpDir(src, dest, skipMd);
    else if (skipMd && entry.name.endsWith(".md")) continue;
    else cpFile(src, dest);
  }
}

rm(out);
fs.mkdirSync(out, { recursive: true });

files.forEach((file) => {
  cpFile(path.join(root, file), path.join(out, file));
});

dirs.forEach((dir) => {
  cpDir(path.join(root, dir), path.join(out, dir), dir === "assets");
});

console.log("www/ ready for Capacitor sync");
