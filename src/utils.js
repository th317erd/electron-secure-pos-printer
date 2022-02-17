const URL_SAFE_ENCODING_KEYS  = { '+': '-', '/': '_', '-': '+', '_': '/' };

function isBufferType(data) {
  return (data instanceof Buffer || data instanceof Uint8Array);
}

function toBase64(_data) {
  var data = _data;
  if (!isBufferType(data))
    data = Buffer.from(('' + _data), 'utf8');

  if (data instanceof Uint8Array)
    data = Buffer.from(data);

  return data.toString('base64');
}

function convertBase64ToURLSafe(encodedData) {
  return encodedData.replace(/[+/]/g, (m) => {
    return URL_SAFE_ENCODING_KEYS[m];
  });
}

function toURLSafeBase64(_data) {
  var data = _data;
  if (!isBufferType(data))
    data = Buffer.from(('' + _data), 'utf8');

  return toBase64(data);
}

module.exports = {
  toURLSafeBase64,
};
