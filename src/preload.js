const { contextBridge, ipcRenderer }  = require('electron');
const { setupSecureBridge }           = require('./index');

setupSecureBridge(contextBridge, ipcRenderer);
