#!/usr/bin/env node
/* ============================================================
   Gameday Mavericks - local preview server (zero dependencies)
   ------------------------------------------------------------
   Usage:   node serve.js            (or double-click preview.cmd)
            PORT=3000 node serve.js   to pick a port

   Serves the built pages from ./_localpreview, but serves
   /assets/* straight from your local ./assets folder so CSS, JS,
   and image edits show up on a browser refresh with no rebuild.

   The pages in _localpreview are produced by build-local.ps1
   (it pulls the Jekyll-built HTML from the live site). Re-run
   that script after you change any .html / Liquid template.
   ============================================================ */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const PROJECT_ROOT = __dirname;
const PREVIEW_DIR = path.join(PROJECT_ROOT, "_localpreview");
let PORT = parseInt(process.env.PORT, 10) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function resolveFile(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]); }
  catch (e) { p = urlPath.split("?")[0]; }
  if (!p.startsWith("/")) p = "/" + p;

  // /assets/* comes from the live source folder; everything else from the build.
  const root = (p === "/assets" || p.startsWith("/assets/")) ? PROJECT_ROOT : PREVIEW_DIR;
  let filePath = path.normalize(path.join(root, p));

  // Path-traversal guard: never serve outside the project folder.
  if (!filePath.startsWith(PROJECT_ROOT)) return null;

  try {
    const st = fs.statSync(filePath);
    if (st.isDirectory()) {
      const idx = path.join(filePath, "index.html");
      return fs.existsSync(idx) ? idx : null;
    }
    return filePath;
  } catch (e) {
    if (!path.extname(filePath)) {
      const idx = path.join(filePath, "index.html");
      if (fs.existsSync(idx)) return idx;
    }
    return null;
  }
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found: " + req.url);
    console.log("404 " + req.url);
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("500 " + err.message);
      return;
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    res.end(data);
    console.log("200 " + req.url);
  });
});

function openBrowser(url) {
  const cmd = process.platform === "win32" ? `start "" "${url}"`
            : process.platform === "darwin" ? `open "${url}"`
            : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

server.on("listening", () => {
  const url = "http://localhost:" + PORT + "/";
  console.log("\n  Gameday Mavericks - local preview");
  console.log("  ----------------------------------");
  console.log("  Pages:   " + PREVIEW_DIR);
  console.log("  Assets:  live from ./assets");
  console.log("  Open:    " + url);
  console.log("\n  Press Ctrl+C to stop.\n");
  if (process.env.GM_NO_OPEN !== "1") openBrowser(url);
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE" && PORT < 8090) {
    console.log("Port " + PORT + " is in use, trying " + (PORT + 1) + "...");
    PORT += 1;
    server.listen(PORT);
  } else {
    console.error(e.message);
    process.exit(1);
  }
});

if (!fs.existsSync(path.join(PREVIEW_DIR, "index.html"))) {
  console.error("\n  _localpreview is empty. Run build-local.ps1 first:");
  console.error("    powershell -ExecutionPolicy Bypass -File build-local.ps1\n");
  process.exit(1);
}
server.listen(PORT);
