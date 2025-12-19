import { app, BrowserWindow, ipcMain } from 'electron'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  // IPC Handlers
  const DATA_DIR = path.join(os.homedir(), 'PrepMe')

  const ensureDir = async () => {
    try {
      await fs.access(DATA_DIR)
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true })
    }
  }

  ipcMain.handle('save-problem', async (_, problem) => {
    await ensureDir()
    // safe filename
    const safeId = problem.id.replace(/[^a-z0-9]/gi, '_')
    const filePath = path.join(DATA_DIR, `${safeId}.json`)
    console.log(`Saving problem ${problem.id} to ${filePath}`);
    await fs.writeFile(filePath, JSON.stringify(problem, null, 2))
    return { success: true, path: filePath }
  })

  ipcMain.handle('load-problem', async (_, id) => {
    await ensureDir()
    const safeId = id.replace(/[^a-z0-9]/gi, '_')
    try {
      const data = await fs.readFile(path.join(DATA_DIR, `${safeId}.json`), 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      return null
    }
  })

  ipcMain.handle('list-problems', async () => {
    await ensureDir()
    const files = await fs.readdir(DATA_DIR)
    const problems = []
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'test_history.json') {
        try {
          const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8')
          const json = JSON.parse(content)
          // Ensure it's a valid problem object (not array or random json)
          if (json && typeof json === 'object' && !Array.isArray(json) && json.id) {
            problems.push(json)
          }
        } catch { }
      }
    }
    return problems
  })

  // Test Results Persistence
  ipcMain.handle('save-test-result', async (_, result) => {
    await ensureDir()
    const historyPath = path.join(DATA_DIR, 'test_history.json')
    let history = []
    try {
      const data = await fs.readFile(historyPath, 'utf-8')
      history = JSON.parse(data)
    } catch {
      // File doesn't exist or is corrupt, start fresh
    }
    history.push(result)
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2))
    return true
  })

  ipcMain.handle('get-test-results', async () => {
    await ensureDir()
    const historyPath = path.join(DATA_DIR, 'test_history.json')
    try {
      const data = await fs.readFile(historyPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  })
})
