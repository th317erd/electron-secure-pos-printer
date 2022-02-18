/*
 * Copyright (c) 2022. Author Wyatt Greenway <th317erd@gmail.com>
 */

"use strict";

const Path            = require('path');
const FileSystem      = require('fs/promises');
const FileSystemSync  = require('fs');
const Nife            = require('nife');
const StyleUtils      = require('./style-utils');
const Utils           = require('./utils');
const QRCode          = require('qrcode');
const JsBarcode       = require('jsbarcode');

const {
  DOMImplementation,
  XMLSerializer,
} = require('xmldom');

const MAIN_STYLE_SHEET      = FileSystemSync.readFileSync(Path.resolve(__dirname, 'main-style-sheet.css'), 'utf8');
const PRINT_PREVIEW_SCRIPT  = FileSystemSync.readFileSync(Path.resolve(__dirname, 'print-preview-script.js'), 'utf8');

function renderElement(name, _attrs, body) {
  var finalAttrs  = [];
  var attrs       = _attrs || {};
  var attrNames   = Object.keys(attrs);

  for (var i = 0, il = attrNames.length; i < il; i++) {
    var attrName  = attrNames[i];
    var value     = attrs[attrName];

    if (Nife.isEmpty(value))
      continue;

    finalAttrs.push(`${attrName}="${('' + value).replace(/"/g, '&quot;')}"`);
  }

  var parts = [ '<', name, (finalAttrs.length) ? ` ${finalAttrs.join(' ')}` : '', '>' ];

  // Is void tag?
  if (!name.match(/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/)) {
    if (Nife.isNotEmpty(body))
      parts.push(body);

    parts.push(`</${name}>`);
  }

  return parts.join('');
}

function renderSection(content, line, options) {
  return renderElement(
    'div',
    {
      class: 'section',
      style: line.sectionStyle,
    },
    content,
  );
}

function renderText(line, options) {
  return renderSection(
    (line.raw) ? (line.value || '') : renderElement(
      'span',
      {
        style: line.style,
      },
      (line.value || ''),
    ),
    line,
    options,
  );
}

async function renderQRCode(line, options) {
  var dataURI = await QRCode.toDataURL(
    line.value,
    Object.assign({
      errorCorrectionLevel: 'Q',
      scale: 5,
    }, line.options || {})
  );

  return renderSection(
    renderElement(
      'img',
      Object.assign({
        style: line.style,
        width: line.width,
        height: line.height,
      }, line.attributes || {}, { src: dataURI }),
    ),
    line,
    options,
  );
}

function renderBarCode(line, options) {
  var xmlSerializer = new XMLSerializer();
  var document      = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
  var svgNode       = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  JsBarcode(
    svgNode,
    line.value,
    Object.assign({
      format: 'UPC',
    }, line.options || {}, { xmlDocument: document }),
  );

  var svgText = xmlSerializer.serializeToString(svgNode);
  var dataURI = `data:image/svg+xml;base64,${Utils.toBase64(svgText)}`;

  return renderSection(
    renderElement(
      'img',
      Object.assign({
        style: line.style,
        width: line.width,
        height: line.height,
      }, line.attributes || {}, { src: dataURI }),
    ),
    line,
    options,
  );
}

async function renderImage(line, options) {
  var dataURI;
  if (line.path) {
    if (Nife.isEmpty(line.mimeType))
      throw new Error('You must specify a "mimeType" for "image" types using a "path" option');

    var filePath  = Path.resolve(line.path);
    var content   = await FileSystem.readFile(filePath);

    dataURI = `data:${line.mimeType};base64,${Utils.toBase64(content)}`;
  }

  var src = dataURI;
  if (!src)
    src = Nife.get(line, 'attributes.src', line.src);

  if (!src)
    throw new Error('No "src" or "path" option specified for "image" type');

  return renderSection(
    renderElement(
      'img',
      Object.assign({
        style: line.style,
        width: line.width,
        height: line.height,
      }, line.attributes || {}, { src }),
    ),
    line,
    options,
  );
}

function renderTable(line, options) {
  if (line.tableStyle)
    line.tableStyle = StyleUtils.compileStyles(line.tableStyle);

  if (line.headerStyle)
    line.headerStyle = StyleUtils.compileStyles(line.headerStyle);

  if (line.bodyStyle)
    line.bodyStyle = StyleUtils.compileStyles(line.bodyStyle);

  if (line.rowStyle)
    line.rowStyle = StyleUtils.compileStyles(line.rowStyle);

  if (line.columnStyle)
    line.columnStyle = StyleUtils.compileStyles(line.columnStyle);

  if (line.footerStyle)
    line.footerStyle = StyleUtils.compileStyles(line.footerStyle);

  const renderHeader = () => {
    if (!(Nife.instanceOf(line.header, 'array') && Nife.isNotEmpty(line.header)))
      return;

    return renderElement(
      'thead',
      Object.assign({ style: line.headerStyle }, line.headerAttributes || {}),
      renderElement(
        'tr',
        Object.assign({ style: line.rowStyle }, line.rowAttributes || {}),
        line.header.map((columnValue) => {
          return renderElement(
            'th',
            Object.assign({ style: line.columnStyle }, line.columnAttributes || {}),
            columnValue,
          );
        }).join(''),
      ),
    );
  };

  const renderRows = () => {
    if (!(Nife.instanceOf(line.rows, 'array') && Nife.isNotEmpty(line.rows)))
      throw new Error('"rows" must be a valid array for the "table" type');

    var columnCount;

    return renderElement(
      'tbody',
      Object.assign({ style: line.bodyStyle }, line.bodyAttributes || {}),
      line.rows.map((columns, rowIndex) => {
        if (columnCount == null) {
          columnCount = columns.length;
        } else if (columns.length !== columnCount) {
          throw new Error(`"table" type row #${rowIndex} has ${(columns.length > columnCount) ? 'more' : 'less'} columns than it should. Expected ${columnCount} columns but found ${columns.length} columns instead.`);
        }

        return renderElement(
          'tr',
          Object.assign({ style: line.rowStyle }, line.rowAttributes || {}),
          columns.map((columnValue) => {
            return renderElement(
              'td',
              Object.assign({ style: line.columnStyle }, line.columnAttributes || {}),
              columnValue || '',
            );
          }).join(''),
        );
      }).join(''),
    );
  };

  const renderFooter = () => {
    if (!(Nife.instanceOf(line.footer, 'array') && Nife.isNotEmpty(line.footer)))
      return;

    return renderElement(
      'tfoot',
      Object.assign({ style: line.footerStyle }, line.footerAttributes || {}),
      renderElement(
        'tr',
        Object.assign({ style: line.rowStyle }, line.rowAttributes || {}),
        line.footer.map((columnValue) => {
          return renderElement(
            'th',
            Object.assign({ style: line.columnStyle }, line.columnAttributes || {}),
            columnValue,
          );
        }).join(''),
      ),
    );
  };

  var parts = [
    renderHeader(),
    renderRows(),
    renderFooter(),
  ].filter(Boolean).join('');

  return renderSection(
    renderElement(
      'table',
      Object.assign({ style: line.tableStyle }, line.tableAttributes || {}),
      parts,
    ),
    line,
    options,
  );
}

function renderFactory(renderMethod) {
  return function renderHelper(_line, options) {
    var line = Object.assign({}, _line);

    if (line.style)
      line.style = StyleUtils.compileStyles(line.style);

    if (line.sectionStyle)
      line.sectionStyle = StyleUtils.compileStyles(line.sectionStyle);

    return renderMethod(line, options);
  };
}

const TYPE_HELPERS = {
  'text':     renderFactory(renderText),
  'qrcode':   renderFactory(renderQRCode),
  'barcode':  renderFactory(renderBarCode),
  'image':    renderFactory(renderImage),
  'table':    renderFactory(renderTable),
};

async function renderDataAsHTML(_data, _options) {
  if (!_data)
    throw new Error('"data" argument is required');

  var options = _options || {};

  var promises = [];

  var data = Nife.toArray(_data);
  for (var i = 0, il = data.length; i < il; i++) {
    var line = data[i];
    if (!line)
      continue;

    var type = line.type;
    if (!type)
      type = 'text';
    else
      type = ('' + type).toLowerCase();

    var renderMethod = TYPE_HELPERS[type];
    if (typeof renderMethod !== 'function')
      throw new Error(`Line type "${type}" not supported`);

    var promise = renderMethod(line, options);
    promises.push(promise);
  }

  var results = await Promise.all(promises);
  return results.join('');
}

async function generateHTMLDocumentForPrinter(data, _options) {
  var options     = _options || {};
  var dataContent = await renderDataAsHTML(data, options);

  var content = renderElement(
    'html',
    Object.assign({ lang: 'en' }, options.htmlAttributes || {}),
    [
      renderElement(
        'head',
        null,
        [
          renderElement('meta', { charset: 'UTF-8' }),
          renderElement('title', null, 'Print Preview'),
          renderElement('style', null, MAIN_STYLE_SHEET),
          (Nife.isNotEmpty(options.styleSheet)) ? renderElement('style', null, options.styleSheet) : null,
          renderElement('script', null, `var SECURE_POS_PRINTER_DOCUMENT_ID='${options.documentID}';`),
        ].filter(Boolean).join(''),
      ),
      renderElement(
        'body',
        Object.assign({}, options.bodyAttributes || {}, { class: (options.preview) ? 'preview' : null }),
        [
          (options.preview) ? `<div class="print-preview-print-button-container"><button onclick="securePOSPrinterCancelPrint(event)">Cancel</button><button onclick="securePOSPrinterPrintDocument(event)">Print</button><script>var SECURE_POS_PRINTER_DATA=${JSON.stringify(data)};var SECURE_POS_PRINTER_OPTIONS=${JSON.stringify(options)};${PRINT_PREVIEW_SCRIPT}</script></div>` : null,
          renderElement(
            'div',
            Object.assign({}, options.containerAttributes || {}, { id: 'container' }),
            dataContent,
          ),
        ].filter(Boolean).join(''),
      ),
    ].filter(Boolean).join(''),
  );

  return `<!DOCTYPE html>\n${content}\n`;
}

module.exports = {
  renderText:     TYPE_HELPERS['text'],
  renderQRCode:   TYPE_HELPERS['qrcode'],
  renderBarCode:  TYPE_HELPERS['barcode'],
  renderImage:    TYPE_HELPERS['image'],
  renderTable:    TYPE_HELPERS['table'],
  renderElement,
  renderSection,
  renderDataAsHTML,
  generateHTMLDocumentForPrinter,
};
