const Path      = require('path');
const Electron  = require('electron');

const { setupSecurePOSPrinter } = require('../src');

var mainWindow;

function createWindow() {
  mainWindow = new Electron.BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      preload: Path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.loadFile(Path.join(__dirname, 'demo.html'));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

const app = Electron.app;

app.on('ready', () => {
  setupSecurePOSPrinter(Electron);

  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
