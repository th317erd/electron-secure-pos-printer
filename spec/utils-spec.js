const Utils = require('../src/utils');

describe("Utils", () => {
  describe("toBase64", () => {
    it("should be able to convert to URL safe base64", () => {
      expect(Utils.toBase64('Testing 1234')).toEqual('VGVzdGluZyAxMjM0');
    });
  });
});
