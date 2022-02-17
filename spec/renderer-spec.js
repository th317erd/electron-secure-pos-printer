const Path        = require('path');
const FileSystem  = require('fs');
const Renderer    = require('../src/renderer');

function matchesSnapshot(name, result) {
  var snapshotPath = Path.resolve(__dirname, 'snapshots', `${name}.snapshot`);

  if (!FileSystem.existsSync(snapshotPath)) {
    FileSystem.writeFileSync(snapshotPath, result, 'utf8');
    return;
  }

  var snapshot = FileSystem.readFileSync(snapshotPath, 'utf8');
  expect(result).toEqual(snapshot);
}

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
      var result = Renderer.renderText({
        type:     'text',
        value:    'Testing 123',
        sectionStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        style: {
          fontWeight: 'bold',
        },
      });

      matchesSnapshot('renderText-1', result);
    });

    it("should be able to render raw text", () => {
      var result = Renderer.renderText({
        type:     'text',
        value:    'Testing 123',
        raw:      true,
        sectionStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      });

      matchesSnapshot('renderText-2', result);
    });
  });

  describe("renderQRCode", () => {
    it("should be able to render a QR code", async () => {
      var result = await Renderer.renderQRCode({
        type:     'qrCode',
        value:    'https://www.saltlakefilmsociety.org/',
        options: {
          scale: 1,
        },
        sectionStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      });

      matchesSnapshot('renderQRCode-1', result);
    });
  });

  describe("renderBarCode", () => {
    it("should be able to render a bar code", async () => {
      var result = await Renderer.renderBarCode({
        type:     'barCode',
        value:    123456789999,
        sectionStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      });

      matchesSnapshot('renderBarCode-1', result);
    });
  });

  describe("renderImage", () => {
    it("should throw an error without a mimeType", async () => {
      try {
        await Renderer.renderImage({
          type: 'image',
          path: 'nopath',
        });

        fail('Expected an exception');
      } catch (error) {
        expect(error.message).toEqual('You must specify a "mimeType" for "image" types using a "path" option');
      }
    });

    it("should be able to render an image", async () => {
      var result = await Renderer.renderImage({
        type:     'image',
        path:     Path.resolve(__dirname, 'support', 'test.png'),
        mimeType: 'image/png',
        sectionStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      });

      matchesSnapshot('renderImage-1', result);
    });
  });

  describe("renderTable", () => {
    it("should throw an error when column counts do not match", async () => {
      try {
        Renderer.renderTable({
          type: 'table',
          header: [ 'Test', 'Columns' ],
          rows: [
            [ 'One' ],
            [ 'Two', 'Three' ],
          ]
        });

        fail('Expected an exception');
      } catch (error) {
        expect(error.message).toEqual('"table" type row #1 has more columns than it should. Expected 1 columns but found 2 columns instead.');
      }

      try {
        Renderer.renderTable({
          type: 'table',
          header: [ 'Test', 'Columns' ],
          rows: [
            [ 'One', 'Two' ],
            [ 'Two' ],
          ]
        });

        fail('Expected an exception');
      } catch (error) {
        expect(error.message).toEqual('"table" type row #1 has less columns than it should. Expected 2 columns but found 1 columns instead.');
      }
    });

    it("should be able to render a table", async () => {
      var result = Renderer.renderTable({
        type:     'table',
        sectionStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        tableStyle: {
          backgroundColor: 'red',
        },
        headerStyle: 'background-color: blue',
        bodyStyle: {
          fontSize: '8mm',
          color: 'black',
        },
        footerStyle: 'background-color: green',
        header: [ 'Item', 'Price' ],
        rows: [
          [ 'Popcorn',  '$5.00' ],
          [ 'Soda',     '$3.00' ],
          [ 'Candy',    '$2.00' ],
        ],
        footer: [ 'Total', '$10.00' ],
      });

      matchesSnapshot('renderTable-1', result);
    });
  });

  describe("renderDataAsHTML", () => {
    it("should be able to render all types", async () => {
      var result = await Renderer.renderDataAsHTML([
        {
          type:     'text',
          value:    'Testing 123',
        },
        {
          type:     'qrCode',
          value:    'https://www.saltlakefilmsociety.org/',
          options: {
            scale: 1,
          },
        },
        {
          type:     'barCode',
          value:    123456789999,
        },
        {
          type:     'image',
          path:     Path.resolve(__dirname, 'support', 'test.png'),
          mimeType: 'image/png',
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
      ]);

      matchesSnapshot('renderDataAsHTML-1', result);
    });
  });

  describe("generateHTMLDocumentForPrinter", () => {
    it("should be able to render complete document", async () => {
      var result = await Renderer.generateHTMLDocumentForPrinter([
        {
          type:     'text',
          value:    'Testing 123',
        },
        {
          type:     'qrCode',
          value:    'https://www.saltlakefilmsociety.org/',
          options: {
            scale: 1,
          },
        },
        {
          type:     'barCode',
          value:    123456789999,
        },
        {
          type:     'image',
          path:     Path.resolve(__dirname, 'support', 'test.png'),
          mimeType: 'image/png',
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
      ]);

      matchesSnapshot('generateHTMLDocumentForPrinter-1', result);
    });
  });
});
