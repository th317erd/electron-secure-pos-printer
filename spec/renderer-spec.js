const Renderer = require('../src/renderer');

describe("Renderer", () => {
  describe("renderElement", () => {
    it("should be able to render elements", () => {
      expect(Renderer.renderElement('img', { src: "https://example.com/image.png" }, 'void')).toEqual('<img src="https://example.com/image.png">');
      expect(Renderer.renderElement('div', { style: "width: 100px;" }, '<span>Something</span>')).toEqual('<div style="width: 100px;"><span>Something</span></div>');
      expect(Renderer.renderElement('div', { style: "   " })).toEqual('<div></div>');
    });
  });

  describe("renderText", () => {
    it("should be able to render text", () => {
      expect(Renderer.renderText({
        type:     'text',
        value:    'Testing 123',
        rowStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        style: {
          fontWeight: 'bold',
        },
      })).toEqual('<div class="row" style="align-items:center;justify-content:center;"><span style="font-weight:bold;">Testing 123</span></div>');
    });
  });
});
