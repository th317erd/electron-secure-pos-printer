/*
 * Copyright (c) 2022. Author Wyatt Greenway <th317erd@gmail.com>
 */

"use strict";

const Utils = require('../src/utils');

describe("Utils", () => {
  describe("toBase64", () => {
    it("should be able to convert to URL safe base64", () => {
      expect(Utils.toBase64('Testing 1234')).toEqual('VGVzdGluZyAxMjM0');
    });
  });

  describe("randomID", () => {
    it("should be able to generate a random id", () => {
      expect(Utils.randomID()).toMatch(/[A-Za-z0-9_-]{16}/);
    });
  });
});
