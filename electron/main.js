const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcMain,
} = require("electron");
const express = require("express");

let overlayWindow;
let showingOverlay = false;

function createWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  overlayWindow.loadURL("http://127.0.0.1:5000/overlay");
  overlayWindow.hide();
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
}

let overlayVisible = false;

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("Control+Shift+O", () => {
    overlayVisible = !overlayVisible;
    overlayWindow.webContents.send("toggle-visibility");
  });
});

app.whenReady().then(() => {
  globalShortcut.register("CommandOrControl+Shift+Q", () => {
    if (showingOverlay) {
      console.log("Global shortcut pressed!");
    }
  });
});

// Electron API
const api = express();
const PORT = 8123;

api.get("/show", (req, res) => {
  overlayWindow.show();
  showingOverlay = true;
  res.send("shown");
});

api.get("/hide", (req, res) => {
  overlayWindow.hide();
  showingOverlay = false;
  res.send("hidden");
});

api.listen(PORT, () => {
  console.log("Electron overlay API running on port", PORT);
});

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  overlayWindow.setIgnoreMouseEvents(ignore, options);
});
