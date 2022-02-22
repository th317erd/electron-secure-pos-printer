/*
 * Copyright (c) 2022. Author Wyatt Greenway <th317erd@gmail.com>
 */

"use strict";

const OS          = require('os');
const Path        = require('path');
const FileSystem  = require('fs');
const Renderer    = require('./renderer');
const Utils       = require('./utils');

var alreadySetup = false;
const previewWindowMap = {};

function printData(data, _options) {
  const { Electron } = this;

  return new Promise(async (resolve, reject) => {
    const cleanupTempFile = () => {
      if (!tempPath)
        return;

      if (FileSystem.existsSync(tempPath)) {
        FileSystem.unlinkSync(tempPath);
      }
    };

    const doResolve = (result) => {
      // Ensure we cleanup after ourselves
      cleanupTempFile();

      resolve(result);
    };

    const doReject = (error) => {
      // Ensure we cleanup after ourselves
      cleanupTempFile();

      reject(error);
    };

    try {
      var options = Object.assign(
        {
          preview:              false,
          silent:               true,
          previewWindowWidth:   360,
          previewWindowHeight:  720,
          copies:               1,
          pageSize:             'A4',
        },
        _options || {},
      );

      if (!options.documentID)
        options.documentID = Utils.randomID();

      // Render print document contents, and write to a temporary file
      var htmlContent = await Renderer.generateHTMLDocumentForPrinter(data, options);
      var randomID    = `secure-pos-printer-${options.documentID}.html`;
      var tempPath    = Path.resolve(OS.tmpdir(), randomID);

      FileSystem.writeFileSync(tempPath, htmlContent, 'utf8');

      var previewWindow = new Electron.BrowserWindow({
        width: options.previewWindowWidth,
        height: options.previewWindowHeight,
        show: !!options.preview,
        webPreferences: {
          preload: Path.join(__dirname, 'preload.js'),
        },
      });

      previewWindow.on('closed', () => {
        delete previewWindowMap[options.documentID];
      });

      // Load the print document we have generated and written
      previewWindow.loadFile(tempPath);

      if (options.preview && options.developmentMode) {
        previewWindow.webContents.openDevTools({
          mode: 'right'
        });
      }

      previewWindow.webContents.on('did-finish-load', async () => {
        // If previewing, then return, and wait for the user to click the "Print" (or "Cancel") button
        if (options.preview) {
          previewWindowMap[options.documentID] = previewWindow;
          return doResolve();
        }

        try {
          // Make it happen!
          await previewWindow.webContents.print(Object.assign({
            silent:           !!options.silent,
            printBackground:  true,
            deviceName:       options.printerName,
            copies:           options.copies,
            pageSize:         options.pageSize,
          }, options.printOptions || {}));

          doResolve();
        } catch (error) {
          doReject(error);
        }
      });

      previewWindow.webContents.on('did-fail-load', async (_, errorCode, errorDescription) => {
        var error = new Error(errorDescription);
        error.code = errorCode;

        doReject(error);
      });
    } catch (error) {
      doReject(error);
    }
  });
}

// Clicking on the "Cancel" button in the preview window simply closes the preview
function cancelPrint(documentID) {
  var previewWindow = previewWindowMap[documentID];
  if (!previewWindow)
    return;

  previewWindow.close();
}

// Get a list of available printers
async function getPrinters() {
  const webContents = this.event.sender;
  return await webContents.getPrintersAsync();
}

// This method is a factory method, used to generate IPC hooks for the main process
function ipcMainBridgeHook(Electron, name, method) {
  const hookHandler = async function(event, ...args) {
    var context = { event, Electron };

    try {
      var result = await method.apply(context, args);
      return [
        null,
        result,
      ];
    } catch (error) {
      console.error(`Error in secure-pos-printer:${name} bridge method: ${error.message}`, error);
      return [ error.message, null ];
    }
  };

  Electron.ipcMain.handle(`secure-pos-printer:${name}`, hookHandler);
}

// Setup IPC hooks for the main process
function setupSecurePOSPrinter(Electron) {
  if (alreadySetup)
    return;

  alreadySetup = true;

  ipcMainBridgeHook(Electron, 'print',        printData)
  ipcMainBridgeHook(Electron, 'cancelPrint',  cancelPrint);
  ipcMainBridgeHook(Electron, 'getPrinters',  getPrinters);
}

// Setup IPC hooks for the renderer process
function setupSecureBridge(contextBridge, ipcRenderer) {
  // Wrap each callback with error handling code
  const generateHookCallback = (name) => {
    return async function(...args) {
      var [ error, result ] = await ipcRenderer.invoke(`secure-pos-printer:${name}`, ...args);
      if (error) {
        throw new Error(error);
      }

      return result;
    };
  };

  contextBridge.exposeInMainWorld('securePOSPrinter', {
    print:        generateHookCallback('print'),
    cancelPrint:  generateHookCallback('cancelPrint'),
    getPrinters:  generateHookCallback('getPrinters'),
  });
}

module.exports = {
  setupSecurePOSPrinter,
  setupSecureBridge,
};
