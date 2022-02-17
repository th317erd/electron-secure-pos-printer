const Nife        = require('nife');
const StyleUtils  = require('./style-utils');

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

function renderRow(content, line, options) {
  return renderElement(
    'div',
    {
      class: 'row',
      style: line.rowStyle,
    },
    content,
  );
}

function renderText(line, options) {
  return renderRow(
    renderElement(
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

}

async function renderBarCode(line, options) {

}

function renderImage(line, options) {

}

function renderTable(line, options) {

}

function renderFactory(renderMethod) {
  return function renderHelper(_line, options) {
    var line = Object.assign({}, _line);

    if (line.style)
      line.style = StyleUtils.compileStyles(line.style);

    if (line.rowStyle)
      line.rowStyle = StyleUtils.compileStyles(line.rowStyle);

    return renderMethod(line, options);
  };
}

const TYPE_HELPERS = {
  'text':     renderFactory(renderText),
  'qrCode':   renderFactory(renderQRCode),
  'barCode':  renderFactory(renderBarCode),
  'image':    renderFactory(renderImage),
  'table':    renderFactory(renderTable),
};

async function renderAsHTML(_data, options) {
  if (!_data)
    throw new Error('"data" argument is required');

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

module.exports = {
  renderText:     TYPE_HELPERS['text'],
  renderQRCode:   TYPE_HELPERS['qrCode'],
  renderBarCode:  TYPE_HELPERS['barCode'],
  renderImage:    TYPE_HELPERS['image'],
  renderTable:    TYPE_HELPERS['table'],
  renderElement,
  renderAsHTML,
};
