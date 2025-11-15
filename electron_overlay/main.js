const { app, BrowserWindow } = require("electron");
const express = require("express");

let overlayWindow = null;

function createOverlay() {
  overlayWindow = new BrowserWindow({
    width: 300,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  overlayWindow.loadFile("overlay.html");
  overlayWindow.hide();
}

app.whenReady().then(createOverlay);

// API SERVER inside Electron
const api = express();
const PORT = 8123;

api.get("/show", (req, res) => {
  overlayWindow.show();
  res.send("shown");
});

api.get("/hide", (req, res) => {
  overlayWindow.hide();
  res.send("hidden");
});

api.listen(PORT, () => {
  console.log("Electron overlay API running on port", PORT);
});
