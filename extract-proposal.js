const fs = require('fs');

const path = 'TripMate_Proposal_Tim.pdf';
const dataBuffer = fs.readFileSync(path);
const uint8Array = new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);

(async () => {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
      const page = await pdfDocument.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      console.log('---PAGE ' + pageNum + '---');
      console.log(pageText.trim().substring(0, 2000));
    }
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
