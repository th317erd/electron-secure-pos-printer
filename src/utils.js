/*
 * Copyright (c) 2022. Author Wyatt Greenway <th317erd@gmail.com>
 */

"use strict";

const URL_SAFE_BASE64_CONVERSION_MAP = { '+': '-', '/': '_' };

var idCounter = 1;
var idGenerationBuffer = Buffer.alloc(12);

function isBufferType(data) {
  return (data instanceof Buffer || data instanceof Uint8Array);
}

function _toBase64(_data) {
  var data = _data;
  if (!isBufferType(data))
    data = Buffer.from(('' + _data), 'utf8');

  if (data instanceof Uint8Array)
    data = Buffer.from(data);

  return data.toString('base64');
}

function toBase64(_data) {
  var data = _data;
  if (!isBufferType(data))
    data = Buffer.from(('' + _data), 'utf8');

  return _toBase64(data);
}

function randomID() {
  var pid   = process.pid;
  var now   = Date.now();
  var hash  = ((pid & 0xFFFF) << 16) | (idCounter & 0xFFFF);

  idGenerationBuffer.writeBigInt64BE(BigInt(now), 0);
  idGenerationBuffer.writeInt32BE(hash, 8);

  idCounter++;

  // URL safe base64 for interoperability with filesystems
  return idGenerationBuffer.toString('base64').replace(/[+/]/g, (m) => {
    return URL_SAFE_BASE64_CONVERSION_MAP[m];
  });
}

module.exports = {
  toBase64,
  randomID,
};
