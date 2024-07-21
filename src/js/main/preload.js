const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script is running'); // Log to verify script execution

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
  },
});

console.log('Preload script setup completed'); // Log to verify setup completion
