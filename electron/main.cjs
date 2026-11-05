// Desktop shell: loads the built app from dist/ in a native window.
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1200,
    minHeight: 700,
    title: 'Football Tagger',
    backgroundColor: '#111827',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.removeMenu();
  win.maximize();

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Open external links in the default browser instead of a new app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // F12 toggles dev tools, Ctrl+R reloads (menu is hidden).
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F12') win.webContents.toggleDevTools();
    if (input.control && input.key.toLowerCase() === 'r') win.webContents.reload();
  });
}

ipcMain.handle('save-pdf', async (event, suggestedName) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save match report',
    defaultPath: suggestedName || 'match-report.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return null;
  const data = await event.sender.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: { marginType: 'custom', top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
  });
  fs.writeFileSync(filePath, data);
  shell.openPath(filePath);
  return filePath;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
