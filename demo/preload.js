const { contextBridge, ipcRenderer }  = require('electron');
const { setupSecureBridge }           = require('../src');

setupSecureBridge(contextBridge, ipcRenderer);
