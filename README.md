![License](https://img.shields.io/npm/l/electron-secure-pos-printer)
![Version](https://img.shields.io/npm/v/electron-secure-pos-printer?label=version)
![Issues](https://img.shields.io/github/issues/th317erd/electron-secure-pos-printer)

# electron-secure-pos-printer

A secure POS (point of sale) printer for Electron. By default, supports 58mm printers, however, it is very configurable, and is designed such that it can even be used without Electron (provided you supply the correct shims).

*Note: The API for this module is inspired by [electron-pos-printer](https://www.npmjs.com/package/electron-pos-printer), however it is NOT the same, so please pay close attention below if you are transitioning over from `electron-pos-printer`.*

### Installation

NPM:
```bash
$ npm install electron-secure-pos-printer
```

Yarn:
```bash
$ yarn add electron-secure-pos-printer
```

# Usage

The module requires only that you configure it in the main Electron process. No script imports or configuration are needed for the renderer HTML.

Step 1: Configure the IPC hooks for the main process

`main.js`
```javascript
const Path      = require('path');
const Electron  = require('electron');

const { setupSecurePOSPrinter } = require('electron-secure-pos-printer');

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

  // Load your app/site into the main window
  mainWindow.loadFile(Path.join(__dirname, 'main.html'));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

const app = Electron.app;

app.on('ready', () => {
  // Setup secure bridge with renderer
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
```

Step 2: Preload for renderer process

`preload.js`
```javascript
const { contextBridge, ipcRenderer }  = require('electron');
const { setupSecureBridge }           = require('electron-secure-pos-printer');

// Setup secure bridge with main process
setupSecureBridge(contextBridge, ipcRenderer);
```

Step 3: Inside your HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Secure POS Printer Test</title>

    <script>
      // This global is exposed by Electron
      /* global securePOSPrinter */

      async function test() {
        // Get a list of attached printers
        var printers = await securePOSPrinter.getPrinters();

        // Print some data

        var data = [
          {
            type:     'text',
            value:    'Testing 123',
          },
          {
            type:     'qrCode',
            value:    'https://www.saltlakefilmsociety.org/',
            options: {
              scale: 4,
            },
          },
          {
            type:     'barCode',
            value:    123456789999,
          },
          {
            // Path to image on file system
            // mimeType is required when loading images from the file system
            type:     'image',
            path:     './assets/printer-image.png',
            mimeType: 'image/png',
          }
          {
            // You can also specify a "src" attribute directly
            type:     'image',
            src:      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gIREQQbbUH0CgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAMUlEQVQI13WOQQ4AIAzCWv//53kwmjiFYyGAAFBVbKmAjR7Ply6NK6Ufo7elqjye7k6T7hILeH2VsAAAAABJRU5ErkJggg==',
            sectionStyle: {
              alignItems: 'center',
              justifyContent: 'center',
            },
            attributes: {
              width: '100px',
              height: '100px',
            },
          },
          {
            type:     'table',
            header: [ 'Item', 'Price' ],
            rows: [
              [ 'Popcorn',  '$5.00' ],
              [ 'Soda',     '$3.00' ],
              [ 'Candy',    '$2.00' ],
            ],
            footer: [ 'Total', '$10.00' ],
          },
        ];

        var options = {
          printerName: 'SomePrinterName',
          // You can specify your own global stylesheet if you want
          styleSheet: "body,#container { width: '110mm'}",
          preview: true,
        };

        // Note: This promise will not resolve until
        // 1) The preview window is shown, or
        // 2) The document has been sent to the printer, or
        // 3) An error occurred
        await securePOSPrinter.print(data, options);
      }

      test();
    </script>
  </head>

  <body>
  </body>
</html>
```

## Printing options
| Option        |  Description         | Default Value |
| :------------- |:-------------| :----------: |
| bodyAttributes | (object) Attributes to assign directly to the `body` tag in the document | `null` |
| containerAttributes | (object) Attributes to assign directly to the `<div id="container">` element in the document. Inside this container is where all the `data` content is rendered | `null` |
| copies     | (number) number of copies to print | `1` |
| htmlAttributes | (object) Attributes to assign directly to the `html` tag in the document | `{ lang: "en" }` |
| margin | (string)  margin of a page, css values can be used   | `0` |
| pageSize | (string) Specify the page medium for the printer | `'A4'` |
| preview      | (boolean) preview in a window | `false` |
| previewWindowHeight      | (number) height of the preview window (in pixels) | `720` |
| previewWindowWidth      | (number) width of the preview window (in pixels) | `360` |
| printerName | (string) the printer's name      | `null` |
| printOptions | (object) Options to pass directly to [Electron.WebContents.print](https://www.electronjs.org/docs/latest/api/web-contents#contentsprintoptions-callback) | `null` |
| silent | (boolean) To print silently without printer selection pop-up | `true` |
| styleSheet | (string) A style sheet (not a file name) to apply globally to the document. This gets inserted in the `head` of the document | `null` |

## The Print data object (common)
| Option | Description | Default |
| :----------- | :-------------- | :---------: |
| sectionStyle | ([StyleType](#styletype)) style to apply to this section (the container of this content) | `null` |
| style | ([StyleType](#styletype)) style to apply to this type | `null` |
| type      | (string) One of `'text'`, `'qrCode'`, `'barCode'`, `'image'`, `'table'` | `'text'` |

## The Print data object (type = 'text')
| Option | Description | Default |
| :----------- | :-------------- | :---------: |
| raw      | (boolean) If `true`, then the `value` provided will *not* be wrapped in a `<span>` element | `false` |
| value      | (string) **REQUIRED** Content to put into this section | `null` |

*Note: By using `raw: true` to can specify any HTML code you want as the `value`*

Example:
```javascript
var data = [
  {
    type: 'text',
    value: 'Some content!',
    // if `true`, then don't wrap content in a <span>
    raw: false,
    // Style applied to the <span> element,
    // ignored if "raw = true"
    style: { fontWeight: 'bold' },
    sectionStyle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  }
];
```

## The Print data object (type = 'qrCode')
| Option | Description | Default |
| :----------- | :-------------- | :---------: |
| attributes | (object) Attributes to assign to the `<img>` tag | `null` |
| height | (number) Height in pixels for the generated QR code image | `null` |
| options | (object) Options object to pass directly to [qrcode.options](https://www.npmjs.com/package/qrcode#user-content-options-9) | `null` |
| value      | (string) **REQUIRED** Content to encode into the QR code | `null` |
| width | (number) Width in pixels for the generated QR code image | `null` |

*Note: The QR code is generated with `qrcode` as a PNG image encoded in a `data:` URI.*

Example:
```javascript
var data = [
  {
    type: 'qrCode',
    value: 'Some content!',
    // Style applied to the <img> element
    style: { width: '40mm', height: '40mm' },
    sectionStyle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    options: {
      scale: 10,
    }
  }
];
```

## The Print data object (type = 'barCode')
| Option | Description | Default |
| :----------- | :-------------- | :---------: |
| attributes | (object) Attributes to assign to the `<img>` tag | `null` |
| height | (number) Height in pixels for the generated bar code image | `null` |
| options | (object) Options object to pass directly to [jsbarcode.options](https://www.npmjs.com/package/jsbarcode#user-content-options) | `null` |
| value      | (number) **REQUIRED** ID to encode into the bar code | `null` |
| width | (number) Width in pixels for the generated bar code image | `null` |

*Note: The barcode is generated with `jsbarcode` as an SVG image encoded in a `data:` URI.*

Example:
```javascript
var data = [
  {
    type: 'barCode',
    value: 123456789999,
    // Style applied to the <img> element
    style: { width: '40mm' },
    sectionStyle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    options: {
      format: 'CODE128',
    }
  }
];
```

## The Print data object (type = 'image')
| Option | Description | Default |
| :----------- | :-------------- | :---------: |
| attributes | (object) Attributes to assign to the `<img>` tag | `null` |
| height | (number) Height in pixels for the image | `null` |
| path | (string) Path on file system to image. If you specify this option then you *must* also specify a `mimeType` for the image | `null` |
| mimeType | (string) This is required if you specify a `path` | `null` |
| src | (string) Specify the `src` attribute of the image directly. If `path` is specified, that will take precedence over this option | `null` |
| width | (number) Width in pixels for the image | `null` |

*Note 1: One of `path` + `mimeType`, or `src` are **required***

*Note 2: If `path` is specified, the image will be loaded from disk, and encoded as a `data:` URI, using the `mimeType` you specified*

Example:
```javascript
var data = [
  {
    type: 'image',
    path: './assets/some-image.png',
    mimeType: 'image/png',
    // Style applied to the <img> element
    style: { width: '40mm', height: '40mm' },
    sectionStyle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  {
    type: 'image',
    src: 'https://image-cdn.com/some-image.png',
    // Style applied to the <img> element
    style: { width: '40mm', height: '40mm' },
    sectionStyle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  }
];
```

## The Print data object (type = 'table')
| Option | Description | Default |
| :----------- | :-------------- | :---------: |
| bodyAttributes | (object) Attributes to assign to the `<tbody>` tag | `null` |
| bodyStyle | ([StyleType](#styletype)) Style to apply to the `<tbody>` tag | `null` |
| columnAttributes | (object) Attributes to assign to all `<td>` tags | `null` |
| columnStyle | ([StyleType](#styletype)) Style to apply to all `<td>` tags | `null` |
| footer | (array[string]) Columns for the footer. If not specified, then there will be no table footer | `null` |
| footerAttributes | (object) Attributes to assign to the `<tfoot>` tag | `null` |
| footerStyle | ([StyleType](#styletype)) Style to apply to the `<tfoot>` tag | `null` |
| header | (array[string]) Columns for the header. If not specified, then there will be no table header | `null` |
| headerAttributes | (object) Attributes to assign to the `<thead>` tag | `null` |
| headerStyle | ([StyleType](#styletype)) Style to apply to the `<thead>` tag | `null` |
| rowAttributes | (object) Attributes to assign to all `<tr>` or `<th>` tags | `null` |
| rows | (array[array[string]]) **REQUIRED** An array (rows) of arrays (columns) for the table | `null` |
| rowStyle | ([StyleType](#styletype)) Style to apply to all `<tr>` or `<th>` tags | `null` |
| tableAttributes | (object) Attributes to assign to the `<table>` tag | `null` |
| tableStyle | ([StyleType](#styletype)) Style to apply to the `<table>` tag | `null` |


*Note: The number of columns must be the same for every row or an exception will be thrown*

Example:
```javascript
var data = [
  {
    type:     'table',
    header: [ 'Item', 'Price' ],
    rows: [
      [ 'Popcorn',  '$5.00' ],
      [ 'Soda',     '$3.00' ],
      [ 'Candy',    '$2.00' ],
    ],
    footer: [ 'Total', '$10.00' ],
  },
];
```

# StyleType

Styles can be applied to elements in a number of different ways. All of the following style definitions can validly be given to any style option:

1. As a string: `'border-width: 0.5mm; color: red;'`
2. As an object: `{ borderWidth: '0.5mm', color: 'red' }`
3. As an array of strings or objects: `[ 'border-width: 0.5mm; color: red;', { borderWidth: '0.5mm', color: 'red' }, rootStyleObject ]`. If using an array of styles, then all styles will be parsed and merged into a single style sheet.

*Note: When using object notation for styles, if you use a `number` for any value, then by default it will be converted into a `mm` unit. For example, `{ width: 10 }` would be converted into `'width: 10mm'` automatically. If a certain style actually needs a raw number, then specify your style as a string instead.*

# About the HTML content for the printer

The content that gets renderered for the printer has roughly the following structure:

```html
<html>
  <head>
    <!-- Default and custom style sheets get injected here -->
  </head>

  <!-- The "preview" class is applied to the body if in preview mode -->
  <body class="preview">
    <div id="container">
      <div class="section">
        <!-- content from "data" goes here -->
      </div>
      <div class="section">
        <!-- content from "data" goes here -->
      </div>
      ...
    </div>
  </body>
</html>
```

Refer to `./src/main-style-sheet.css` for the default styles applied to the print document.

If you request `preview: true` in the options, then extra scripts and content will be injected into the preview document to enable the "Cancel" and "Print" buttons at the top of the preview to function properly.

# Sponors

Many thanks to all our sponors!

**This work was sponsored by MAST @ Salt Lake Film Society**

![MAST](sponsors/mast.gif?raw=true "MAST @ Salt Lake Film Society")
