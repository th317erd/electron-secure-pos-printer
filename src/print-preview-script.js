/*
 * Copyright (c) 2022. Author Wyatt Greenway <th317erd@gmail.com>
 */

"use strict";

/* global SECURE_POS_PRINTER_DOCUMENT_ID, SECURE_POS_PRINTER_DATA, SECURE_POS_PRINTER_OPTIONS, securePOSPrinter */

function securePOSPrinterPrintDocument() {
  securePOSPrinter.print(SECURE_POS_PRINTER_DATA, Object.assign({}, SECURE_POS_PRINTER_OPTIONS, { preview: false }));
}

function securePOSPrinterCancelPrint() {
  securePOSPrinter.cancelPrint(SECURE_POS_PRINTER_DOCUMENT_ID);
}
