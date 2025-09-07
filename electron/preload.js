const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onOpenFileDialog: (callback) => ipcRenderer.on('open-file-dialog', callback),
  onConvertObjToMef: (callback) => ipcRenderer.on('convert-obj-to-mef', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});