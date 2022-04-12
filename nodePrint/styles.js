const tocStyles = `
  #libre-print-directory-header {
    color: white !important;
    font-size: 1.6em !important;
    font-family: "Lato", Arial, serif !important;
    text-transform: uppercase;
    font-weight: bold;
    margin: 0 0 0 1% !important;
    padding: 1% 0 !important;
    letter-spacing: .05em !important;
  }
  #libre-print-directory-header-container {
    display: flex;
    background: #127BC4;
    margin: 0 0 2%;
    padding: 0;
    width: 100%;
    align-items: center;
  }
  .nobreak {
    page-break-inside: avoid;
  }
  .indent0 {
    margin-left: 6px !important;
  }
  .indent1 {
    margin-left: 12px !important;
  }
  .indent2 {
    margin-left: 18px !important;
  }
  .indent3 {
    margin-left: 24px !important;
  }
  .indent4 {
    margin-left: 30px !important;
  }
  .libre-print-list {
    list-style-type: none;
    margin: 0;
    padding: 0;
    font-size: 12px;
  }
  .libre-print-list li {
    padding-bottom: 5px;
  }
`;

module.exports = {
  tocStyles
};