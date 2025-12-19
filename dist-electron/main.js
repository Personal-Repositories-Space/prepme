import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      webviewTag: true
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  const DATA_DIR = path.join(os.homedir(), "PrepMe");
  const ensureDir = async () => {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  };
  ipcMain.handle("save-problem", async (_, problem) => {
    await ensureDir();
    const safeId = problem.id.replace(/[^a-z0-9]/gi, "_");
    const filePath = path.join(DATA_DIR, `${safeId}.json`);
    console.log(`Saving problem ${problem.id} to ${filePath}`);
    await fs.writeFile(filePath, JSON.stringify(problem, null, 2));
    return { success: true, path: filePath };
  });
  ipcMain.handle("load-problem", async (_, id) => {
    await ensureDir();
    const safeId = id.replace(/[^a-z0-9]/gi, "_");
    try {
      const data = await fs.readFile(path.join(DATA_DIR, `${safeId}.json`), "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  });
  ipcMain.handle("list-problems", async () => {
    await ensureDir();
    const files = await fs.readdir(DATA_DIR);
    const problems = [];
    for (const file of files) {
      if (file.endsWith(".json") && file !== "test_history.json") {
        try {
          const content = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
          const json = JSON.parse(content);
          if (json && typeof json === "object" && !Array.isArray(json) && json.id) {
            problems.push(json);
          }
        } catch {
        }
      }
    }
    return problems;
  });
  ipcMain.handle("save-test-result", async (_, result) => {
    await ensureDir();
    const historyPath = path.join(DATA_DIR, "test_history.json");
    let history = [];
    try {
      const data = await fs.readFile(historyPath, "utf-8");
      history = JSON.parse(data);
    } catch {
    }
    history.push(result);
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    return true;
  });
  ipcMain.handle("get-test-results", async () => {
    await ensureDir();
    const historyPath = path.join(DATA_DIR, "test_history.json");
    try {
      const data = await fs.readFile(historyPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
