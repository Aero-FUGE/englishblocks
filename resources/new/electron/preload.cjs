const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('englishBlocksDiskSave', {
  read: () => ipcRenderer.sendSync('englishblocks:save-read'),
  write: (snapshot) => ipcRenderer.sendSync('englishblocks:save-write', snapshot),
  openMobilePreview: () => ipcRenderer.invoke('englishblocks:mobile-preview')
});
