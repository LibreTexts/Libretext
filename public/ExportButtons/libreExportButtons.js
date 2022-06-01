/**
 * @file Adds export options and menus to the LibreTexts library pages.
 * @author LibreTexts <info@libretexts.org>
 */
if (!(navigator.webdriver || window.matchMedia('print').matches) && !LibreTexts?.active?.exportButtons) {
  // only load if client-facing and not yet initialized

  const ARROW_UP_KEY = 'ArrowUp';
  const ARROW_DOWN_KEY = 'ArrowDown';
  const ENTER_KEY = 'Enter';
  const ESCAPE_KEY = 'Escape';
  const SPACE_KEY = ' ';

  const ID_CONTAINER_DIV = 'libreExportButtons';
  const ID_PDF_DROPDOWN_BTN = 'libre-pdf-dropdown-btn';
  const ID_DWNLD_DROPDOWN_BTN = 'libre-dwnld-dropdown-btn';
  const ID_PDF_DROPDOWN_CONTENT = 'libre-pdf-dropdown-content';
  const ID_DWNLD_DROPDOWN_CONTENT = 'libre-dwnld-dropdown-content';
  const ID_RDBLTY_BTN = 'libre-readability-btn';

  const CLASS_DROPDOWN = 'libre-dropdown';
  const CLASS_DROPDOWN_BTN = 'libre-dropdown-btn';
  const CLASS_PDF_DROPDOWN_ITEM = 'libre-pdf-dropdown-item';
  const CLASS_DWNLD_DROPDOWN_ITEM = 'libre-dwnld-dropdown-item';
  const CLASS_BUTTON_ICON_TEXT = 'libre-icon-btn-text';
  const CLASS_DROPDOWN_OPEN_STATE = 'dropdown-open';
  const CLASS_DONORBOX_LINK = 'libretexts-dbox-popup';

  /**
   * Finds the current text's coverpage and retrieves the Full PDF download link.
   *
   * @returns {string|boolean} The Full PDF download link, or false if not found.
   */
  const getBook = async () => {
    let coverpage = await LibreTexts.getCoverpage();
    if (coverpage) {
      const [subdomain] = LibreTexts.parseURL();
      coverpage = await LibreTexts.getAPI(`https://${subdomain}.libretexts.org/${coverpage}`);
      return `https://batch.libretexts.org/print/Finished/${subdomain}-${coverpage.id}/Full.pdf`;
    }
    return false;
  };

  /**
   * Submits a request to the LibreTexts Batch server to compile the current page or book.
   *
   * @param {string} target - The url of the page or book to compile.
   * @param {string} [additionalParameters=''] - Additional parameters to add to the request URL.
   */
  const batch = (target, additionalParameters = '') => {
    if (window.LibreTextsBatchCompleted) {
      window.open(window.LibreTextsBatchCompleted, '_blank', 'noreferrer');
    } else {
      /**
       * Handles a progress event from the bach network request and updates the provided
       * HTML element with the estimated progress.
       *
       * @param {Element} progressIndicator - An Element to update with the progress.
       * @param {XMLHttpRequest} origRequest - The original network request.
       */
      const receiveBatchProgress = (progressIndicator, origRequest) => {
        const progressButton = progressIndicator;
        const newData = origRequest?.responseText?.match(/^{.+}$(?!\s*^.*}$)/m);
        if (newData) {
          const progressData = JSON.parse(newData[0]);
          if (progressButton) {
            progressButton.innerText = `${progressData.percent}% ${progressData.eta}`;
          }
        }
      };

      /**
       * Handles a completion event from the bach network request, updates the provided
       * HTML element a completion message, and opens the completed file.
       *
       * @param {Element} progressIndicator - An Element to update with the completion message.
       * @param {XMLHttpRequest} origRequest - The original network request.
       */
      const downloadBatchOutput = (progressIndicator, origRequest) => {
        const progressButton = progressIndicator;
        const newData = origRequest?.responseText?.match(/^{.+}$(?!\s*^.*}$)/m)[0];
        if (newData) {
          const output = JSON.parse(newData);
          if (output.filename === 'refreshOnly') {
            progressButton.innerText = 'Refresh complete.';
            return;
          }
          if (output.filename === 'createMatterOnly') {
            progressButton.innerText = 'Done creating front/back matter.';
            return;
          }
          if (output.message === 'error') {
            alert(output.text);
            return;
          }
          if (output.filename) {
            progressButton.innerText = 'Finished';
            const fileLocation = `https://batch.libretexts.org/print/Finished/${output.filename}/Full.pdf`;
            window.open(fileLocation, '_blank', 'noreferrer');
            window.LibreTextsBatchCompleted = fileLocation;
          }
        }
      };

      const batchButton = document.getElementById(ID_PDF_DROPDOWN_BTN);
      batchButton.classList.remove('material-icons');
      batchButton.innerText = 'Request sent...';
      const request = new XMLHttpRequest();
      request.open('GET', `https://batch.libretexts.org/print/Libretext=${target ? `${target}?no-cache${additionalParameters}` : window.location.href}`, true);
      request.addEventListener('progress', () => receiveBatchProgress(batchButton, request));
      request.addEventListener('load', () => downloadBatchOutput(batchButton, request));
      request.send();
    }
  };

  /**
   * Creates a new button with a dropdown element and interactions built in.
   *
   * @param {object} props - Properties to use while building the dropdown.
   * @param {string} props.dropdownClass - The class to set on the main dropdown div.
   * @param {string} props.dropdownBtnId - The DOM ID to set on the dropdown button.
   * @param {string} props.dropdownBtnClass - The class to set on the dropdown button.
   * @param {string} props.dropdownBtnTitle - The HTML title/label to set on the dropdown button.
   * @param {string} [props.dropdownIconName] - The name of the icon to include on the dropdown
   *  button, if desired.
   * @param {string} [props.dropdownIconClass] - The class to set on the icon included in the
   *  dropdown button, if desired.
   * @param {string} [props.dropdownText] - The UI text to include in the dropdown button,
   *  if desired.
   * @param {string} props.dropdownOptsId - The DOM ID to set on the dropdown options container.
   * @param {string} props.dropdownOptsOpenClass - The class to set on the dropdown options
   *  container when the dropdown is open.
   * @param {string} props.dropdownOptsBtnClass - The class to set on each dropdown option button.
   * @param {string} props.dropdownOptsBtnTxtClass - The class to set on the UI text included in
   *  each dropdown option button.
   * @param {object[]} props.dropdownOptions - An array of objects containing information about
   *  each dropdown option to include.
   * @returns {HTMLElement} - The dropdown ready for DOM inclusion.
   */
  const createDropdown = ({
    dropdownClass,
    dropdownBtnId,
    dropdownBtnClass,
    dropdownBtnTitle,
    dropdownIconName,
    dropdownIconClass,
    dropdownText,
    dropdownOptsId,
    dropdownOptsOpenClass,
    dropdownOptsBtnClass,
    dropdownOptsBtnTxtClass,
    dropdownOptions,
  }) => {
    /**
     * Creates a new dropdown button with interactions attached.
     *
     * @param {object} buttonProps - Properties to use while assembling the button.
     * @param {string} buttonProps.text - The UI text to include in the button.
     * @param {string} buttonProps.title - The HTML title/label to set on the button.
     * @param {string} [buttonProps.href] - The URL to open when the button is clicked, if the
     *  button should function as a link.
     * @param {Function} [buttonProps.listener] - The function to run when the button is clicked,
     *  if it should not function as a link.
     * @param {string} [buttonProps.icon] - The CXone icon to set as the button's contents,
     *  if desired.
     * @param {Function} focusOutListener - A function to run when the button loses focus.
     * @param {Function} keyDownListener - A function to run when a key is pressed while the button
     *  is focused.
     * @returns {HTMLElement} The new button to include in the dropdown.
     */
    const createDropdownButton = ({
      text, title, href, listener, icon,
    }, focusOutListener, keyDownListener) => {
      let didAddIcon = false;
      /* Create basic structure */
      const newButton = document.createElement('button');
      Object.assign(newButton, {
        classList: dropdownOptsBtnClass,
        type: 'button',
        ariaLabel: title,
        title,
      });
      /* Add text and icons */
      if (typeof (icon) === 'string') {
        const buttonIcon = document.createElement('span');
        Object.assign(buttonIcon, { classList: icon, ariaHidden: true });
        newButton.appendChild(buttonIcon);
        didAddIcon = true;
      }
      if (typeof (text) === 'string') {
        const newTextNode = document.createTextNode(text);
        if (didAddIcon) {
          const buttonText = document.createElement('span');
          Object.assign(buttonText, { classList: dropdownOptsBtnTxtClass, ariaHidden: true });
          buttonText.appendChild(newTextNode);
          newButton.appendChild(buttonText);
        } else {
          newButton.appendChild(newTextNode);
        }
      }
      /* Add actions */
      if (typeof (listener) === 'function') {
        newButton.addEventListener('click', listener);
      } else if (typeof (href) === 'string') {
        newButton.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(href, '_blank', 'noreferrer');
        });
      }
      newButton.addEventListener('focusout', focusOutListener);
      newButton.addEventListener('keydown', keyDownListener);
      return newButton;
    };

    /* Create dropdown elements */
    const newDropdown = document.createElement('div');
    const newDropdownBtn = document.createElement('button');
    const newDropdownOpts = document.createElement('div');
    newDropdown.classList.add(dropdownClass);
    Object.assign(newDropdownBtn, {
      id: dropdownBtnId,
      classList: dropdownBtnClass,
      type: 'button',
      title: dropdownBtnTitle,
      tabIndex: 0,
      ariaExpanded: false,
    });
    if (dropdownIconName && dropdownIconClass) {
      const newDropdownIcon = document.createElement('span');
      Object.assign(newDropdownIcon, { classList: dropdownIconClass, ariaHidden: true });
      newDropdownIcon.appendChild(document.createTextNode(dropdownIconName));
      newDropdownBtn.appendChild(newDropdownIcon);
    }
    if (dropdownText) {
      const newDropdownText = document.createTextNode(dropdownText);
      newDropdownText.ariaHidden = true;
      newDropdownBtn.appendChild(newDropdownText);
    }
    newDropdown.appendChild(newDropdownBtn);
    newDropdownOpts.id = dropdownOptsId;

    /* Add actions */
    const openDropdown = (e) => {
      if (e) e.preventDefault();
      newDropdownBtn.ariaExpanded = true;
      newDropdownOpts.classList.add(dropdownOptsOpenClass);
    };
    const closeDropdown = (e) => {
      if (e) e.preventDefault();
      newDropdownBtn.ariaExpanded = false;
      newDropdownOpts.classList.remove(dropdownOptsOpenClass);
    };
    newDropdown.addEventListener('mouseenter', openDropdown);
    newDropdown.addEventListener('mouseleave', closeDropdown);
    newDropdown.addEventListener('keydown', (e) => {
      if (e.key === ESCAPE_KEY) closeDropdown(e);
    });
    newDropdown.addEventListener('focusout', (e) => {
      if (newDropdownOpts?.children) {
        const dropdownChildren = Array.from(newDropdownOpts.children);
        if (dropdownChildren && dropdownChildren.length > 0) {
          if (!dropdownChildren.includes(e.relatedTarget)) {
            // New focus is not in the dropdown, close it
            closeDropdown(e);
          }
        }
      }
    });
    newDropdownBtn.addEventListener('click', openDropdown);
    newDropdownBtn.addEventListener('keydown', (e) => {
      if (e.key === ENTER_KEY || e.key === SPACE_KEY) {
        openDropdown(e);
      } else if (e.key === ARROW_DOWN_KEY) {
        e.preventDefault();
        if (newDropdownBtn.ariaExpanded === 'true') {
          if (newDropdownOpts?.children && newDropdownOpts.children.length > 0) {
            newDropdownOpts.children[0].focus(); // focus first element in list
          }
        }
      }
    });

    /**
     * Searches the dropdown options to detect if any if still have focus.
     *  If not, the dropdown is closed.
     *
     * @param {FocusEvent} e - The event that triggered the listener.
     */
    const optionFocusOutListener = (e) => {
      if (newDropdownOpts?.children) {
        e.stopPropagation();
        const dropdownChildren = Array.from(newDropdownOpts.children);
        if (dropdownChildren && dropdownChildren.length > 0) {
          const lastChild = dropdownChildren[dropdownChildren.length - 1];
          if (e.target === lastChild && !dropdownChildren.includes(e.relatedTarget)) {
            // Last element in list lost focus and new focus is not in list, so close dropdown
            closeDropdown(e);
          }
        }
      }
    };

    /**
     * Detects up or down arrow presses from the keyboard and attempts to focus the next relative
     *  option in the dropdown list.
     *
     * @param {KeyboardEvent} e - The event that triggered the listener.
     */
    const optionKeyDownListener = (e) => {
      if (e.key === ARROW_DOWN_KEY || e.key === ARROW_UP_KEY) {
        e.preventDefault();
        if (newDropdownOpts?.children) {
          const dropdownChildren = Array.from(newDropdownOpts.children);
          if (dropdownChildren && dropdownChildren.length > 0) {
            const currElemIdx = dropdownChildren.findIndex((elem) => elem === e.target);
            if (currElemIdx > -1) {
              let prevElement = null;
              let nextElement = null;
              if ((currElemIdx - 1 >= 0) && dropdownChildren[currElemIdx - 1]) {
                prevElement = dropdownChildren[currElemIdx - 1];
              }
              if (
                (currElemIdx + 1 < dropdownChildren.length)
                && dropdownChildren[currElemIdx + 1]
              ) {
                nextElement = dropdownChildren[currElemIdx + 1];
              }
              if (e.key === ARROW_DOWN_KEY && nextElement) {
                // Move down to next elem in list
                nextElement.focus();
              }
              if (e.key === ARROW_UP_KEY && prevElement) {
                // Move up to previous elem in list
                prevElement.focus();
              }
            }
          }
        }
      }
    };

    /* Add dropdown options/list elements */
    if (dropdownOptions && dropdownOptions.length > 0) {
      for (let i = 0, n = dropdownOptions.length; i < n; i += 1) {
        newDropdownOpts.appendChild(createDropdownButton(
          dropdownOptions[i],
          optionFocusOutListener,
          optionKeyDownListener,
        ));
      }
    }

    newDropdown.appendChild(newDropdownOpts);
    return newDropdown;
  };

  /**
   * Retrieves information about the current LibreText and inserts applicable export dropdowns
   *  and the Readability menu toggle into the DOM.
   */
  const loadExportButtons = async () => {
    const isAdmin = document.getElementById('adminHolder').innerText === 'true';
    const isPro = document.getElementById('proHolder').innerText === 'true';
    const groups = document.getElementById('groupHolder').innerText;
    const batchAccess = isAdmin || (isPro && groups.includes('BatchAccess'));
    const [subdomain] = LibreTexts.parseURL();

    try {
      const tags = document.getElementById('pageTagsHolder').innerText;
      let downloadEntry = null;
      const url = window.location.href.replace(/#$/, '');
      if (tags.includes('coverpage:yes')) {
        const pageID = document.getElementById('pageIDHolder').innerText;
        const isNonEnglishLib = subdomain === 'espanol';
        const directoryPath = window.location.href.includes('/Courses') ? 'Courses' : 'Bookshelves';
        const part = isNonEnglishLib ? 'home' : directoryPath;
        const downloadsListing = await fetch(`https://api.libretexts.org/DownloadsCenter/${subdomain}/${part}.json`);
        let downloads = await downloadsListing.json();
        if (downloads.items) {
          downloads = downloads.items; // extract listings
        }
        const foundListing = downloads.find((ent) => ent.id === pageID || ent.altID === pageID);
        if (foundListing) {
          const denyProAccess = !isPro && foundListing.tags.includes('luluPro'); // needs 'pro' access
          if (!foundListing.failed && !denyProAccess) {
            downloadEntry = foundListing;
          }
        }
      }
      const isChapter = !downloadEntry && tags.includes('"article:topic-guide"');
      const fullBook = await getBook();
      const exportFragment = document.createDocumentFragment(); // create in a vDOM first
      const exportContainer = document.createElement('div');
      exportContainer.id = ID_CONTAINER_DIV;

      /* PDF Export Dropdown */
      const pdfExportOptions = [];

      /* Full PDF Download */
      if (fullBook) {
        pdfExportOptions.push({
          text: 'Full Book',
          title: 'Get a PDF of this book (opens in a new tab)',
          href: fullBook,
        });
      }
      /* Chapter PDF Download */
      if (isChapter) {
        pdfExportOptions.push({
          text: 'Chapter',
          title: 'Get a PDF of this chapter (opens in a new tab)',
          listener: (e) => {
            e.preventDefault();
            batch();
          },
        });
      }
      /* Page PDF Download */
      if (tags.includes('"article:topic"')) {
        pdfExportOptions.push({
          text: 'Page',
          title: 'Get a PDF of this page (opens in a new tab)',
          href: `https://batch.libretexts.org/print/url=${window.location.href}.pdf`,
        });
      }
      /* Compile Book (Page + Subpages) */
      if (batchAccess && pdfExportOptions.length > 0) { // don't add option if page is non-content
        pdfExportOptions.push({
          text: 'Compile Book',
          title: 'Compile this page and all subpages (opens in new tab when complete)',
          listener: (e) => {
            e.preventDefault();
            batch();
          },
          icon: 'mt-icon-spinner6',
        });
      }
      /* Compile Full Book */
      if (batchAccess && downloadEntry) {
        pdfExportOptions.push({
          text: 'Compile Full',
          title: 'Fully recompile this book (opens in new tab when complete)',
          listener: (e) => {
            e.preventDefault();
            const confirmMsg = 'This will refresh all of the pages and will take quite a while. Are you sure?';
            if (window.confirm(confirmMsg)) {
              batch(window.location.href);
            }
          },
          icon: 'mt-icon-spinner6',
        });
      }

      if (pdfExportOptions.length > 0) {
        exportContainer.appendChild(createDropdown({
          dropdownClass: CLASS_DROPDOWN,
          dropdownBtnId: ID_PDF_DROPDOWN_BTN,
          dropdownBtnClass: CLASS_DROPDOWN_BTN,
          dropdownBtnTitle: 'PDF Export Options',
          dropdownIconName: 'picture_as_pdf',
          dropdownIconClass: 'material-icons',
          dropdownOptsId: ID_PDF_DROPDOWN_CONTENT,
          dropdownOptsOpenClass: CLASS_DROPDOWN_OPEN_STATE,
          dropdownOptsBtnClass: CLASS_PDF_DROPDOWN_ITEM,
          dropdownOptsBtnTxtClass: CLASS_BUTTON_ICON_TEXT,
          dropdownOptions: pdfExportOptions,
        }));
      }

      /* Prepared Download Dropdown */
      if (downloadEntry) {
        let linkRoot = 'https://batch.libretexts.org/print/Finished/';
        if (downloadEntry.zipFilename) {
          linkRoot += downloadEntry.zipFilename.replace('/Full.pdf', '');
        }
        const downloadOptions = [
          {
            text: 'Full PDF',
            title: 'Download Full PDF',
            href: `${linkRoot}/Full.pdf`,
            icon: 'mt-icon-file-pdf',
          },
          {
            text: 'Import into LMS',
            title: 'Download LMS Import File',
            href: `${linkRoot}/LibreText.imscc`,
            icon: 'mt-icon-graduation',
          },
          {
            text: 'Individual ZIP',
            title: 'Download ZIP of Individual Pages',
            href: `${linkRoot}/Individual.zip`,
            icon: 'mt-icon-file-zip',
          },
          {
            text: 'Buy Print Copy',
            title: 'Buy Paper Copy (opens in new tab)',
            href: `https://libretexts.org/bookstore/single.html?${downloadEntry.zipFilename}`,
            icon: 'mt-icon-book2',
          },
          {
            text: 'Print Book Files',
            title: 'Download Publication Files',
            href: `${linkRoot}/Publication.zip`,
            icon: 'mt-icon-book3',
          },
        ];

        exportContainer.appendChild(createDropdown({
          dropdownClass: CLASS_DROPDOWN,
          dropdownBtnId: ID_DWNLD_DROPDOWN_BTN,
          dropdownBtnClass: CLASS_DROPDOWN_BTN,
          dropdownBtnTitle: 'LibreText Download Options',
          dropdownText: 'Downloads',
          dropdownOptsId: ID_DWNLD_DROPDOWN_CONTENT,
          dropdownOptsOpenClass: CLASS_DROPDOWN_OPEN_STATE,
          dropdownOptsBtnClass: CLASS_DWNLD_DROPDOWN_ITEM,
          dropdownOptsBtnTxtClass: CLASS_BUTTON_ICON_TEXT,
          dropdownOptions: downloadOptions,
        }));
      }

      /* Readability Options Button */
      const readabilityButton = document.createElement('button');
      Object.assign(readabilityButton, {
        id: ID_RDBLTY_BTN,
        title: 'Open Readability Menu',
        type: 'button',
        tabIndex: 0,
      });
      const readabilityIcon = document.createElement('span');
      Object.assign(readabilityIcon, { classList: 'mt-icon-binoculars', ariaHidden: true });
      readabilityButton.appendChild(readabilityIcon);
      const readabilityText = document.createElement('span');
      Object.assign(readabilityText, { classList: CLASS_BUTTON_ICON_TEXT, ariaHidden: true });
      readabilityText.appendChild(document.createTextNode('Readability'));
      readabilityButton.appendChild(readabilityText);

      /**
       * Opens the Readability menu in the global sidebar.
       *
       * @param {MouseEvent} e - The event that triggered the listener.
       */
      const openReadabilityMenu = (e) => {
        e.preventDefault();
        if (typeof (LibreTexts.active?.sidebarToggleDrawer('readability')) === 'function') {
          LibreTexts.active?.sidebarToggleDrawer('readability')();
        }
      };

      readabilityButton.addEventListener('click', openReadabilityMenu);
      readabilityButton.addEventListener('keydown', (e) => {
        if (e.key === ENTER_KEY) openReadabilityMenu(e);
      });
      exportContainer.appendChild(readabilityButton);

      /* Add DonorBox links (if applicable) */
      if (!isAdmin) {
        const donorBoxLink = document.createElement('a');
        Object.assign(donorBoxLink, {
          href: 'https://donorbox.org/libretexts',
          target: '_blank',
          rel: 'noreferrer',
          classList: `${CLASS_DONORBOX_LINK} notSS`,
          id: 'donate',
          ariaLabel: 'Donate to LibreTexts (opens in modal)',
        });
        donorBoxLink.appendChild(document.createTextNode('Donate'));
        exportContainer.appendChild(donorBoxLink);
        window.DonorBox = { widgetLinkClassName: CLASS_DONORBOX_LINK };
        const donorBoxScript = document.createElement('script');
        Object.assign(donorBoxScript, {
          type: 'text/javascript',
          src: 'https://donorbox.org/install-popup-button.js',
          defer: true,
        });
        document.body.append(donorBoxScript);
      }

      /* Styles */
      const commonButtonStyles = `
        color: #FFFFFF !important;
        border: none !important;
        border-radius: 0;
        margin: 0 2.5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 35px;
        box-shadow: none !important;
      `;
      const dropdownListStyles = `
        display: block !important;
        z-index: 1000;
        position: absolute;
        width: 150px;
        margin-left: 2.5px;
      `;
      const dropdownOptionsStyles = `
        width: 150px !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        color: #FFFFFF !important;
        height: 40px !important;
      `;
      document.head.insertAdjacentHTML('beforeend', `
      <style>
        #${ID_CONTAINER_DIV} {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
          justify-content: center;
        }
        #${ID_RDBLTY_BTN}, #${ID_RDBLTY_BTN}:hover {
          background-color: #D4D4D4 !important;
          color: #000000 !important;
          border: none !important;
          border-radius: 0;
          box-shadow: none !important;
          height: 35px;
          margin: 0 2.5px;
        }
        #${ID_RDBLTY_BTN}:focus {
          border: 3px solid #30B3F6 !important;
        }
        .${CLASS_BUTTON_ICON_TEXT} {
          margin-left: 5px;
        }
        #${ID_PDF_DROPDOWN_BTN} {
          background-color: #C53030 !important;
          ${commonButtonStyles}
        }
        #${ID_PDF_DROPDOWN_BTN}:focus {
          border: 3px solid #30B3F6 !important;
          box-shadow: none !important;
        }
        #${ID_PDF_DROPDOWN_CONTENT} {
          display: none;
          background-color: #C53030;
          color: #FFFFFF;
          font-size: 14px;
        }
        #${ID_PDF_DROPDOWN_CONTENT}.${CLASS_DROPDOWN_OPEN_STATE} {
          ${dropdownListStyles}
        }
        #${ID_PDF_DROPDOWN_CONTENT} li:not(:first-child) {
          border-top: 1px solid #FFFFFF;
        }
        .${CLASS_PDF_DROPDOWN_ITEM}, .${CLASS_PDF_DROPDOWN_ITEM}:hover {
          background-color: #C53030 !important;
          ${dropdownOptionsStyles}
        }
        .${CLASS_PDF_DROPDOWN_ITEM}:hover {
          background-color: #9C2626 !important;
        }
        .${CLASS_PDF_DROPDOWN_ITEM}:not(:first-child) {
          border-top: 1px solid white !important;
        }
        .${CLASS_PDF_DROPDOWN_ITEM}:focus {
          border: 3px solid #30B3F6 !important;
          box-shadow: none !important;
        }
        #${ID_DWNLD_DROPDOWN_BTN} {
          background-color: #187AC9 !important;
          ${commonButtonStyles}
        }
        #${ID_DWNLD_DROPDOWN_BTN}:focus {
          border: 3px solid #0B0115 !important;
          box-shadow: none !important;
        }
        #${ID_DWNLD_DROPDOWN_CONTENT} {
          display: none;
          background-color: #187AC9;
          color: #FFFFFF;
          font-size: 14px; 
        }
        #${ID_DWNLD_DROPDOWN_CONTENT}.${CLASS_DROPDOWN_OPEN_STATE} {
          ${dropdownListStyles}
        }
        #${ID_DWNLD_DROPDOWN_CONTENT} li:not(:first-child) {
          border-top: 1px solid #FFFFFF;
        }
        .${CLASS_DWNLD_DROPDOWN_ITEM}, .${CLASS_DWNLD_DROPDOWN_ITEM}:hover {
          background-color: #187AC9 !important;
          ${dropdownOptionsStyles}
        }
        .${CLASS_DWNLD_DROPDOWN_ITEM}:hover {
          background-color: #1361A0 !important;
        }
        .${CLASS_DWNLD_DROPDOWN_ITEM}:not(:first-child) {
          border-top: 1px solid white !important;
        }
        .${CLASS_DWNLD_DROPDOWN_ITEM}:focus {
          border: 3px solid #0B0115 !important;
          box-shadow: none !important;
        }
      </style>
    `);

      /* Add buttons to DOM */
      exportFragment.appendChild(exportContainer);
      const cxSocialShare = document.querySelector('.elm-social-share');
      if (cxSocialShare) {
        cxSocialShare.replaceChildren(exportFragment);
      }

      const getTOCLink = document.getElementById('getTOCLink');
      if (getTOCLink) {
        getTOCLink.rel = 'noopener nofollow';
        getTOCLink.href = `https://batch.libretexts.org/print/toc=${url}`;
      }
    } catch (e) {
      console.error(`[ExportButtons]: ${e.toString()}`);
    }
    LibreTexts.active.exportButtons = true;
  };

  window.addEventListener('load', loadExportButtons);
}
