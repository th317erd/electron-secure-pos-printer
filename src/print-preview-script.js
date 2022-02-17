/* global SECURE_POS_PRINTER_DATA, SECURE_POS_PRINTER_OPTIONS, securePOSPrinter */

function securePOSPrinterPrintDocument() {
  securePOSPrinter.print(SECURE_POS_PRINTER_DATA, Object.assign({}, SECURE_POS_PRINTER_OPTIONS, { preview: false }));
}
