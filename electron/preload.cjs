const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  savePdf: name => ipcRenderer.invoke('save-pdf', name),
});
