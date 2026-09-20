const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('licenseAPI', {
  getLocalMachineId: () => ipcRenderer.invoke('get-local-machine-id'),
  generateLicense: (data) => ipcRenderer.invoke('generate-license', data),
});
