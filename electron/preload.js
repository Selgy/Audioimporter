const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onShortcut: (callback) => ipcRenderer.on('global-shortcut', (event, shortcut) => callback(shortcut)),
});
