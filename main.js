const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  shell,
} = require("electron");
const express = require("express");
const path = require("path");

function create_tray() {
  tray = new Tray(
    path.join(__dirname, "backend", "public", "assets", "images", "logo.png")
  );

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Toggle Overlay",
      click: () => {
        if (overlayWindow.isVisible()) {
          overlayWindow.hide();
        } else {
          overlayWindow.show();
        }
      },
    },
    {
      label: "Go to Webpage",
      click: () => {
        shell.openExternal("http://127.0.0.1:5000/");
        overlayWindow.hide();
      },
    },
    {
      label: "Restart",
      click: () => {
        app.relaunch();
        app.exit(0);
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Ai Companion");
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    mainWindow.show();
  });
}

function create_overlay_window() {
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
    skipTaskbar: false,
    icon: path.join(
      __dirname,
      "backend",
      "public",
      "assets",
      "images",
      "logo.png"
    ),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  // overlayWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  create_overlay_window();
  create_tray();
});
