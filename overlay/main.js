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
const { spawnSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const venvPath = path.join(__dirname, ".venv");
const flaskApp = path.join(__dirname, "..", "backend", "app.py");
let flask;
let overlay;
let showingOverlay = false;
let overlayVisible;

function getVenvPython() {
  if (process.platform === "win32") {
    return path.join(venvPath, "Scripts", "python.exe");
  } else {
    return path.join(venvPath, "bin", "python");
  }
}

function install() {
  function getPythonExecutable() {
    if (process.platform === "win32") {
      // Try 'python', then 'py'
      const testPython = spawnSync("python", ["--version"], {
        stdio: "ignore",
      });
      if (testPython.status === 0) return "python";
      const testPy = spawnSync("py", ["--version"], { stdio: "ignore" });
      if (testPy.status === 0) return "py";
      return null;
    } else {
      // Linux/macOS
      return "python3";
    }
  }

  const pythonExe = getPythonExecutable();
  if (!pythonExe) {
    console.error(
      "Python not found! Please install Python from python.org and ensure it's in your PATH."
    );
    process.exit(1);
  }

  function installReqs() {
    const reqPath = path.join(__dirname, "requirements.txt");

    console.log("Installing Python packages from requirements.txt...");

    const install = spawnSync(
      getVenvPython(),
      ["-m", "pip", "install", "-r", reqPath],
      {
        stdio: "inherit",
      }
    );

    if (install.status !== 0) {
      console.error("Failed to install packages from requirements.txt.");
      process.exit(1);
    }

    console.log("All packages installed successfully!");
  }

  // Create virtual environment if it doesn't exist
  if (!fs.existsSync(venvPath)) {
    console.log("Creating Python virtual environment...");
    const createVenv = spawnSync(pythonExe, ["-m", "venv", "venv"], {
      stdio: "inherit",
    });
    if (createVenv.status !== 0) {
      console.error("Failed to create virtual environment.");
      process.exit(1);
    } else {
      // Install requirements
      console.log("Installing Python packages from requirements.txt...");
      installReqs();
    }
  }

  console.log("All packages installed successfully!");
}

function create_overlay() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  overlay = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: false,
    icon: path.join(__dirname, "logo.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  overlay.loadURL("http://127.0.0.1:5000/overlay");

  overlay.setIgnoreMouseEvents(true, { forward: true });

  overlay.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      overlay.hide();
    }
  });
}

function run_flask() {
  console.log("Starting Flask app...");
  flask = spawn(getVenvPython(), [flaskApp], { stdio: "inherit" });

  flask.on("close", (code) => {
    console.log(`Flask app exited with code ${code}`);
  });
}

install();

run_flask();

app.whenReady().then(() => {
  create_overlay();

  globalShortcut.register("Control+Shift+O", () => {
    overlayVisible = !overlayVisible;
    overlay.webContents.send("toggle-visibility");
  });

  tray = new Tray(path.join(__dirname, "logo.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Toggle Overlay",
      click: () => {
        if (overlay.isVisible()) {
          overlay.hide();
        } else {
          overlay.show();
        }
      },
    },
    {
      label: "Go to Webpage",
      click: () => {
        shell.openExternal("http://127.0.0.1:5000/");
        overlay.hide();
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

  app.on("window-all-closed", () => {
    if (flask) flask.kill();
    if (process.platform !== "darwin") app.quit();
  });
});

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  overlay.setIgnoreMouseEvents(ignore, options);
});

const api = express();
const PORT = 8123;

api.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

api.get("/show", (req, res) => {
  overlay.show();
  showingOverlay = true;
  res.send("shown");
});

api.get("/hide", (req, res) => {
  console.log("hiding");
  overlay.hide();
  showingOverlay = false;
  res.send("hidden");
});

api.get("/status", (req, res) => {
  res.json({
    visible: true,
  });
});

api.listen(PORT, () => {
  console.log("Electron overlay API running on port", PORT);
});
