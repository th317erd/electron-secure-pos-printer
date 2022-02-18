/*
 * Copyright (c) 2022. Author Wyatt Greenway <th317erd@gmail.com>
 */

"use strict";

const StyleUtils = require('../src/style-utils');

describe("StyleUtils", () => {
  describe("convertStyleNameToCSSName", () => {
    it("should be able to convert a style name", () => {
      expect(StyleUtils.convertStyleNameToCSSName('width')).toEqual('width');
      expect(StyleUtils.convertStyleNameToCSSName('alignItems')).toEqual('align-items');
      expect(StyleUtils.convertStyleNameToCSSName('justifyContent')).toEqual('justify-content');
      expect(StyleUtils.convertStyleNameToCSSName('lineHeight')).toEqual('line-height');
    });
  });

  describe("convertCSSNameToStyleName", () => {
    it("should be able to convert a style name", () => {
      expect(StyleUtils.convertCSSNameToStyleName('width')).toEqual('width');
      expect(StyleUtils.convertCSSNameToStyleName('align-items')).toEqual('alignItems');
      expect(StyleUtils.convertCSSNameToStyleName('justify-content')).toEqual('justifyContent');
      expect(StyleUtils.convertCSSNameToStyleName('line-height')).toEqual('lineHeight');
    });
  });

  describe("convertStyleValueToCSSValue", () => {
    it("should be able to convert a style name", () => {
      expect(StyleUtils.convertStyleValueToCSSValue('width', 10)).toEqual('10mm');
      expect(StyleUtils.convertStyleValueToCSSValue('align-items', 'center')).toEqual('center');
      expect(StyleUtils.convertStyleValueToCSSValue('justify-content', '"center"')).toEqual('"center"');
      expect(StyleUtils.convertStyleValueToCSSValue('line-height', 1)).toEqual(1);
    });
  });

  describe("parseCSSStringToObject", () => {
    it("should be able to convert a css string into a style object", () => {
      expect(StyleUtils.parseCSSStringToObject('width: 10px\nheight: 1mm; color : red; align-items: "center";\n;line-height: 1')).toEqual({
        width: '10px',
        height: '1mm',
        color: 'red',
        alignItems: '"center"',
        lineHeight: '1',
      });
    });
  });

  describe("convertStyleObjectToCSS", () => {
    it("should be able to convert a style object to CSS", () => {
      expect(StyleUtils.convertStyleObjectToCSS({
        width: 10,
        height: 10,
        color: 'red',
        fontWeight: '10px',
        lineHeight: 1,
        alignItems: 'center',
        justifyContent: 'center',
      })).toEqual('align-items:center;color:red;font-weight:10px;height:10mm;justify-content:center;line-height:1;width:10mm;');
    });
  });

  describe("mergeStyles", () => {
    it("should be able to merge multiple styles", () => {
      expect(StyleUtils.mergeStyles(
        { color: 'blue' },
        'width: 10px\nheight: 1mm; color : red; align-items: "center";\n;line-height: 1',
        [ { fontSize: '10px', justifyContent: 'center' }, 'padding: 10px', 'margin: 10px; height: 10mm', { border: 1 } ],
        { borderWidth: 1 },
      )).toEqual({
        color: 'red',
        width: '10px',
        height: '10mm',
        alignItems: '"center"',
        fontSize: '10px',
        justifyContent: 'center',
        margin: '10px',
        border: 1,
        borderWidth: 1,
        padding: '10px',
        lineHeight: '1',
      });
    });
  });

  describe("compileStyles", () => {
    it("should be able to merge and compile multiple styles", () => {
      expect(StyleUtils.compileStyles(
        { color: 'blue' },
        'width: 10px\nheight: 1mm; color : red; align-items: "center";\n;line-height: 1',
        [ { fontSize: '10px', justifyContent: 'center' }, 'padding: 10px', 'margin: 10px; height: 10mm', { border: 1 } ],
        { borderWidth: 1 },
      )).toEqual('align-items:"center";border:1mm;border-width:1mm;color:red;font-size:10px;height:10mm;justify-content:center;line-height:1;margin:10px;padding:10px;width:10px;');
    });
  });
});
