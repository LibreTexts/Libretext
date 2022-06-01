/**
 * @file Exports default branded headers and footers for PDF output.
 * @author LibreTexts <info@libretexts.org>
 */

const pdfPageMargins = '0.75in 0.625in 0.9in'; // top, left/right, bottom

/**
 * Returns a PDF page header as an HTML string.
 * @param {string} headerImg - The base64 encoded header logo image.
 * @returns Header as HTML string with styles.
 */
function generatePDFHeader(headerImg) {
  return `
    <style>
    * {
      -webkit-print-color-adjust: exact;
    }
      #header {
          padding: 0 !important;
          margin: 0 !important;
      }
      #libreHeader {
          height: 100%;
          display: flex;
          align-items: center;
          margin: 0;
          margin-left: 0.4in;
          width: 100vw;
          padding-top: 1%;
      }
      #libreHeader img {
          height: 25px;
          margin: 0;
          padding: 0;
      }
      #libreHeader a {
          margin: 0;
          padding: 0;
      }
    </style>
    <div id="libreHeader">
      <a href="https://libretexts.org"><img src="data:image/png;base64,${headerImg}" /></a>
    </div>
  `
};

/**
 * Returns a PDF page footer as an HTML string.
 * @param {string} mainColor - The main branding color as hex string.
 * @param {object} [currentPage] - Object with information about the current page.
 * @param {object} [pageLicense] - Object with information about the page's license.
 * @param {string} prefix - The page numbering prefix (section number).
 * @returns {string} Footer as HTML string with styles.
 */
function generatePDFFooter(mainColor, currentPage, pageLicense, prefix) {
  return `
    <style>
      * {
        -webkit-print-color-adjust: exact;
      }
      a {
          text-decoration:none;
          color: white;
      }
      #libreFooter {
          display: flex;
          width: 100vw;
          height: 20px;
          margin: 0 4%;
          border-radius: 10px;
          font-size: 7px;
          justify-content: center;
          background-color: ${mainColor};
      }
      #libreFooter > a {
          display: block;
      }
      .footer-left {
          display: inline-flex;
          flex: 1;
          align-items: center;
          justify-content: space-between;
          color: #F5F5F5;
          padding: 1%;
      }
      .footer-left img {
          vertical-align: middle;
          height: 15px;
          display: inline-block;
          padding-right: 1px;
      }
      .footer-center {
          display: inline-flex;
          align-items: center;
          justify-content: center;
      }
      .footer-pagenum {
        background-color: white;
        border: 1px solid ${mainColor};
        color: ${mainColor};
        padding: 2px;
        border-radius: 10px;
        min-width: 10px;
        text-align: center;
        font-size: 8px;
      }
      .footer-right {
          display: inline-flex;
          flex: 1;
          align-items: center;
          justify-content: flex-end;
          color: #F5F5F5;
          padding: 1%;
      }
      .date, .pageNumber {
          display: inline-block;
      }
      #footer {
          display: flex;
          align-items: center;
          padding: 0 !important;
          margin: 0 !important;
      }
      .added {
          padding: 0 4px;
      }
    </style>
    <div id="libreFooter">
      <div class="footer-left">
          <a href="${pageLicense ? pageLicense.link : ''}">${pageLicense ? pageLicense.label : ''}</a>
      </div>
      <div class="footer-center">
            <div class="footer-pagenum">
              ${prefix}<div class="pageNumber"></div>
            </div>
      </div>
      <div class="footer-right">
          ${currentPage ? (
            `<a href="https://${currentPage.subdomain}.libretexts.org/@go/page/${currentPage.id}?pdf">https://${currentPage.subdomain}.libretexts.org/@go/page/${currentPage.id}</a>`
          ): ''}
      </div>
    </div>
  `;
};

module.exports = {
  pdfPageMargins,
  generatePDFHeader,
  generatePDFFooter
}
