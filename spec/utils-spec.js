const Utils = require('../src/utils');

describe("Utils", () => {
  describe("toURLSafeBase64", () => {
    it("should be able to convert to URL safe base64", () => {
      expect(Utils.toURLSafeBase64('Testing 1234')).toEqual('VGVzdGluZyAxMjM0');
    });
  });
});
