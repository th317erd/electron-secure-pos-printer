const Nife = require('nife');

function convertStyleNameToCSSName(styleName) {
  return styleName.replace(/[A-Z]/g, (m) => {
    return `-${m}`;
  }).toLowerCase();
}

function convertCSSNameToStyleName(cssName) {
  return cssName.trim().replace(/-([a-z])/g, (m, part) => {
    return part.toUpperCase();
  });
}

function parseCSSStringToObject(cssString) {
  var styleObject = {};

  (cssString + ';').replace(/[\n\r]+/g, ';').replace(/.*?;/g, (part) => {
    if (Nife.isEmpty(part))
      return part;

    part.replace(/[\s;]+$/, '').replace(/^([^:]+):(.*)$/, (m, name, value) => {
      var ruleName = convertCSSNameToStyleName(name);
      styleObject[ruleName] = value.trim();
    });
  });

  return styleObject;
}

function convertStyleValueToCSSValue(ruleName, value) {
  if (value == null || !Nife.instanceOf(value, 'number', 'string'))
    return;

  if (Nife.instanceOf(value, 'number') && !ruleName.match(/^(line-height)$/))
    return `${value}mm`;

  return value;
}

function convertStyleObjectToCSS(styleObject) {
  var keys          = Object.keys(styleObject);
  var finalStyle    = [];
  var finalStyleObj = {};

  for (var i = 0, il = keys.length; i < il; i++) {
    var key       = keys[i];
    var ruleName  = convertStyleNameToCSSName(key);
    var value     = convertStyleValueToCSSValue(ruleName, styleObject[key]);
    if (value == null)
      continue;

    finalStyleObj[ruleName] = value;
  }

  keys = Object.keys(finalStyleObj).sort();
  for (var i = 0, il = keys.length; i < il; i++) {
    var key   = keys[i];
    var value = finalStyleObj[key];

    finalStyle.push(`${key}:${value}`);
  }


  finalStyle.push('');

  return finalStyle.join(';');
}

function mergeStyles(...args) {
  var styles      = args.filter((style) => Nife.isNotEmpty(style));
  var finalStyle  = {};

  for (var i = 0, il = styles.length; i < il; i++) {
    var style = styles[i];

    if (Nife.instanceOf(style, 'array'))
      style = mergeStyles.apply(this, style);
    else if (Nife.instanceOf(style, 'string'))
      style = parseCSSStringToObject(style);
    else if (!Nife.instanceOf(style, 'object'))
      continue;

    Object.assign(finalStyle, style);
  }

  return finalStyle;
}

function compileStyles(...args) {
  var finalStyle = mergeStyles(...args);
  return convertStyleObjectToCSS(finalStyle);
}

module.exports = {
  convertStyleNameToCSSName,
  convertCSSNameToStyleName,
  parseCSSStringToObject,
  convertStyleValueToCSSValue,
  convertStyleObjectToCSS,
  mergeStyles,
  compileStyles,
};
