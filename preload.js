const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  switchTab: (tabId) => ipcRenderer.send('switch-tab', tabId)
});
