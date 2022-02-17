const OS          = require('os');
const Path        = require('path');
const FileSystem  = require('fs');
const Renderer    = require('./renderer');

var alreadySetup = false;

function printData(data, _options, Electron) {
  return new Promise(async (resolve, reject) => {
    const cleanupTempFile = () => {
      if (!tempPath)
        return;

      if (FileSystem.existsSync(tempPath)) {
        FileSystem.unlinkSync(tempPath);
      }
    };

    const doResolve = (result) => {
      cleanupTempFile();
      resolve(result);
    };

    const doReject = (error) => {
      cleanupTempFile();
      reject(error);
    };

    try {
      var options = Object.assign(
        {
          preview:              false,
          silent:               true,
          previewWindowWidth:   610,
          previewWindowHeight:  720,
          copies:               1,
          pageSize:             'A4',
        },
        _options || {},
      );

      var htmlContent = await Renderer.generateHTMLDocumentForPrinter(data, options);
      var randomID    = `secure-pos-printer-${((Math.random() + Math.random() + Math.random()) + '').replace(/\D/g, '')}.html`;
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

      previewWindow.loadFile(tempPath);

      previewWindow.webContents.openDevTools();

      previewWindow.webContents.on('did-finish-load', async () => {
        // If previewing, then return, and wait for the user to click the "Print" button
        if (options.preview)
          return doResolve();

        try {
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

function setupSecurePOSPrinter(Electron) {
  if (alreadySetup)
    return;

  alreadySetup = true;

  Electron.ipcMain.handle(`secure-pos-printer:print`, async (event, data, options) => {
    try {
      var result = await printData(data, options, Electron);
      return [
        null,
        result,
      ];
    } catch (error) {
      console.error(`Error in secure-pos-printer:print bridge method: ${error.message}`, error);
      return [ error.message, null ];
    }
  });

  Electron.ipcMain.handle(`secure-pos-printer:getPrinters`, async (event) => {
    try {
      const webContents = event.sender;

      var printers = await webContents.getPrintersAsync();

      return [
        null,
        printers,
      ];
    } catch (error) {
      console.error(`Error in secure-pos-printer:getPrinters bridge method: ${error.message}`, error);
      return [ error.message, null ];
    }
  });
}

function setupSecureBridge(contextBridge, ipcRenderer) {
  contextBridge.exposeInMainWorld('securePOSPrinter', {
    print: async (data, options) => {
      var [ error, result ] = await ipcRenderer.invoke(`secure-pos-printer:print`, data, options);
      if (error) {
        throw new Error(error);
      }

      return result;
    },
    getPrinters: async () => {
      var [ error, result ] = await ipcRenderer.invoke(`secure-pos-printer:getPrinters`);
      if (error) {
        throw new Error(error);
      }

      return result;
    },
  });
}

module.exports = {
  setupSecurePOSPrinter,
  setupSecureBridge,
};
