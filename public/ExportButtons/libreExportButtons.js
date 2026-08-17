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
  const ID_REVIEW_DROPDOWN_BTN = 'libre-review-dropdown-btn';
  const ID_REVIEW_DROPDOWN_CONTENT = 'libre-review-dropdown-content';
  const ID_COMMONS_ADOPTIONREPORT_BTN = 'libre-commons-adoptionreport-btn';
  const ID_COMMONS_PEERREVIEW_BTN = 'libre-commons-peerreview-btn';
  const ID_COMMONS_ADAPT_BTN = 'libre-commons-adapt-btn';
  const ID_COMMONS_MATERIALS_BTN = 'libre-commons-materials-btn';
  const ID_COMMONS_BTN = 'libre-commons-btn';
  const ID_CONDUCTOR_PROJECT_BTN = 'libre-conductor-project-btn';

  const CLASS_DROPDOWN = 'libre-dropdown';
  const CLASS_DROPDOWN_BTN = 'libre-dropdown-btn';
  const CLASS_PDF_DROPDOWN_ITEM = 'libre-pdf-dropdown-item';
  const CLASS_DWNLD_DROPDOWN_ITEM = 'libre-dwnld-dropdown-item';
  const CLASS_REVIEW_DROPDOWN_ITEM = 'libre-review-dropdown-item';
  const CLASS_BUTTON_ICON_TEXT = 'libre-icon-btn-text';
  const CLASS_DROPDOWN_OPEN_STATE = 'dropdown-open';
  const CLASS_DONORBOX_LINK = 'libretexts-dbox-popup';
  const CLASS_BUY_PRINT_COPY_BTN = 'libre-buy-print-copy-btn';

  // Shapeshift export service (replaces the retired batch.libretexts.org server).
  const SHAPESHIFT_API = 'https://downloads.libretexts.org/api/v1';
  const JOB_POLL_INTERVAL_MS = 5000;
  const MAX_JOB_POLL_ATTEMPTS = 360; // ~30 min at JOB_POLL_INTERVAL_MS; bounds runaway polling

  // Export jobs currently being polled, keyed by target URL. Prevents repeated clicks from
  // submitting duplicate jobs and spawning parallel poll loops against the Shapeshift API.
  const activeBatchJobs = new Set();

  let currentCoverpage = null;
  let currentSubdomain = null;

  /**
   * Builds the Shapeshift book identifier (e.g. "chem-12345") for the current text.
   *
   * @returns {string} The library-prefixed book ID.
   */
  const getBookID = () => currentSubdomain && currentCoverpage ? `${currentSubdomain}-${currentCoverpage.id}` : '';

  /**
   * Builds a Shapeshift download URL for a given book and export format. The endpoint
   * responds with a 302 redirect to a short-lived signed CloudFront URL.
   *
   * @param {string} bookID - The library-prefixed book ID (e.g. "chem-12345").
   * @param {string} format - The export format (pdf, epub, thincc, pages, publication).
   * @returns {string} The Shapeshift download URL.
   */
  const getDownloadURL = (bookID, format) => `${SHAPESHIFT_API}/download/${bookID}/${format}`;

  /**
   * Loads information about the current text's coverpage, if it exists, into memory.
   *
   * @returns {Promise<boolean>} True if information loaded, false otherwise.
   */
  const loadCoverpage = async () => {
    const coverPath = await LibreTexts.getCoverpage();
    if (coverPath) {
      const [subdomain] = LibreTexts.parseURL();
      currentSubdomain = subdomain;
      currentCoverpage = await LibreTexts.getAPI(`https://${subdomain}.libretexts.org/${coverPath}`);
      LibreTexts.current.coverpage = currentCoverpage;
      const coverpageInfoAvailable = new Event('libre-coverpageinfoavailable', {
        cancelable: true,
      });
      window.dispatchEvent(coverpageInfoAvailable);
      return true;
    }
    return false;
  };

  /**
   * Finds the current text's coverpage and retrieves the Full PDF download link.
   *
   * @returns {Promise<string|boolean>} The Full PDF download link, or false if not found.
   */
  const getBook = async () => {
    if (!currentCoverpage) {
      await loadCoverpage();
    }
    if (currentCoverpage) {
      return getDownloadURL(getBookID(), 'pdf');
    }
    return false;
  };

  /**
   * Attempts to retrieve a LibreText's catalog listing in the LibreCommons.
   *
   * @returns {Promise<object|null>} The book's listing, or null if not found.
   */
  const getBookCommonsEntry = async () => {
    if (!currentCoverpage) {
      await loadCoverpage();
    }
    if (currentCoverpage) {
      try {
        const commonsRes = await fetch(
          `https://commons.libretexts.org/api/v1/commons/book/${currentSubdomain}-${currentCoverpage.id}`,
          { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
        );
        if (commonsRes.status === 200) {
          const entryData = await commonsRes.json();
          const bookData = entryData.book;
          LibreTexts.current.commons = bookData;
          const commonsInfoAvailable = new Event('libre-commonsinfoavailable', {
            cancelable: true,
          });
          window.dispatchEvent(commonsInfoAvailable);
          return bookData;
        }
      } catch (e) {
        console.error(`[ExportButtons]: ${e.toString()}`);
      }
    }
    return null;
  };

  const getBookProjectID = async () => {
    try {
      if(!currentCoverpage){
        await loadCoverpage();
      }
      if(currentCoverpage){
        const projectInfoAvailable = new Event('libre-projectinfoavailable', {
          cancelable: true,
        });

        // Check local storage for projectID first
        const projectID = localStorage.getItem(`projectID-${currentSubdomain}-${currentCoverpage.id}`);
        if(projectID){
          LibreTexts.current.projectID = projectID;
          window.dispatchEvent(projectInfoAvailable);
          return projectID;
        }

        // If not found in local storage, fetch from conductor
        const conductorRes = await fetch(
          `https://commons.libretexts.org/api/v1/project/find-by-book/${currentSubdomain}-${currentCoverpage.id}`,
          { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
        );

        if(conductorRes.status === 200){
          const projectData = await conductorRes.json();
          const projectID = projectData.projectID;
          LibreTexts.current.projectID = projectID;
          window.dispatchEvent(projectInfoAvailable);

          // Save projectID to local storage
          if(projectID){
            localStorage.setItem(`projectID-${currentSubdomain}-${currentCoverpage.id}`, projectID);
          }

          return projectID;
        }
      }
    } catch (e) {
      console.error(`[ExportButtons]: ${e.toString()}`);
    }
    return null;
  }

  /**
   * Attempts to retrieve download availability information from the systemwide downloads listings.
   *
   * @param {boolean} [isPro=false] - Current user has "Pro" access.
   * @returns {Promise<object|null>} The found download listing, or null if not found
   *  or access denied.
   */
  const getDownloadsAvailability = async (isPro = false) => {
    if (!currentCoverpage) {
      await loadCoverpage();
    }
    if (currentCoverpage) {
      const isNonEnglishLib = currentSubdomain === 'espanol';
      const directoryPath = window.location.href.includes('/Courses') ? 'Courses' : 'Bookshelves';
      const file = isNonEnglishLib ? 'home' : directoryPath;
      const listingsURL = `https://api.libretexts.org/DownloadsCenter/${currentSubdomain}/${file}.json`;
      const listings = await fetch(listingsURL);
      let foundListings = await listings.json();
      if (foundListings.items) {
        foundListings = foundListings.items; // extract listings
      }
      const coverIDString = currentCoverpage.id.toString();
      const foundEntry = foundListings.find((entry) => (
        entry.id === coverIDString || entry.altID === coverIDString
      ));
      if (foundEntry) {
        const denyProAccess = !isPro && foundEntry.tags.includes('luluPro'); // needs 'pro' access
        if (!foundEntry.failed && !denyProAccess) {
          return foundEntry;
        }
      }
    }
    return null;
  };

  /**
   * Submits an export job to the Shapeshift service to compile the current page or book,
   * then polls for completion. Shapeshift doesn't stream progress like legacy Batch, so 
   * the PDF dropdown button shows a generic "Compiling" state until the job finishes, at
   * which point the resulting PDF is opened. Completed jobs are memoized per target to
   * avoid recompiling.
   *
   * @param {string} [target] - The URL of the page or book to compile. Defaults to the
   *  current page URL.
   */
  const batch = async (target) => {
    const jobTarget = target || window.location.href;
    if (!window.LibreTextsBatchCompleted) {
      window.LibreTextsBatchCompleted = {};
    }
    // Already compiled this target: just reopen the finished file.
    if (window.LibreTextsBatchCompleted[jobTarget]) {
      window.open(window.LibreTextsBatchCompleted[jobTarget], '_blank', 'noreferrer');
      return;
    }
    // Already compiling this target: ignore the click so we don't submit a duplicate job
    // or start a second poll loop.
    if (activeBatchJobs.has(jobTarget)) {
      return;
    }
    activeBatchJobs.add(jobTarget);

    const batchButton = document.getElementById(ID_PDF_DROPDOWN_BTN);
    batchButton.classList.remove('material-icons');
    batchButton.innerText = 'Request sent...';

    /**
     * Marks the job for this target as no longer in-flight (allowing a future retry) and
     * updates the dropdown button label. Called on every terminal outcome.
     *
     * @param {string} label - The text to display on the dropdown button.
     */
    const endBatchJob = (label) => {
      activeBatchJobs.delete(jobTarget);
      batchButton.innerText = label;
    };

    /**
     * Polls Shapeshift for the status of a job until it finishes, fails, or exceeds the
     * attempt cap, opening the resulting PDF on success.
     *
     * @param {string} jobID - The Shapeshift job identifier to poll.
     * @param {number} [attempt=1] - The current poll attempt number.
     */
    const pollJob = async (jobID, attempt = 1) => {
      try {
        const statusRes = await fetch(`${SHAPESHIFT_API}/job/${jobID}`);
        const statusBody = await statusRes.json();
        const job = statusBody?.data;
        if (!statusRes.ok || !job) {
          throw new Error(statusBody?.msg || 'Failed to retrieve export job status.');
        }
        if (job.status === 'finished') {
          const fileLocation = getDownloadURL(job.bookID, 'pdf');
          window.LibreTextsBatchCompleted[jobTarget] = fileLocation;
          window.open(fileLocation, '_blank', 'noreferrer');
          endBatchJob('Finished');
          return;
        }
        if (job.status === 'failed') {
          endBatchJob('Export failed');
          alert('The export job failed. Please try again later.');
          return;
        }
        // Still 'created' or 'inprogress': keep polling until the attempt cap is reached.
        if (attempt >= MAX_JOB_POLL_ATTEMPTS) {
          endBatchJob('Export timed out');
          alert('The export is taking longer than expected. Please try again later.');
          return;
        }
        setTimeout(() => pollJob(jobID, attempt + 1), JOB_POLL_INTERVAL_MS);
      } catch (e) {
        // Stop polling on any error rather than hammering the API on transient failures.
        endBatchJob('Export failed');
        console.error(`[ExportButtons]: ${e.toString()}`);
        alert('Something went wrong while exporting. Please try again later.');
      }
    };

    try {
      const jobRes = await fetch(`${SHAPESHIFT_API}/job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobTarget }),
      });
      const jobBody = await jobRes.json();
      const jobID = jobBody?.data?.id;
      if (!jobRes.ok || !jobID) {
        throw new Error(jobBody?.msg || 'Failed to create export job.');
      }
      batchButton.innerText = 'Compiling…';
      pollJob(jobID);
    } catch (e) {
      endBatchJob('Export failed');
      console.error(`[ExportButtons]: ${e.toString()}`);
      alert('Something went wrong while exporting. Please try again later.');
    }
  };

  /*
   * Cover-page rendering is not yet supported by Shapeshift (no cover endpoint exists in
   * the API). The legacy batch.libretexts.org implementation is preserved below, commented
   * out, so it can be revived if/when Shapeshift adds an equivalent.
   *
   * const cover = (target) => {
   *   const numPages = prompt('Number of content pages:');
   *   if (numPages && !Number.isNaN(numPages)) {
   *     window.open(
   *       `https://batch.libretexts.org/print/cover=${target}&options={"numPages":"${numPages}", "hasExtraPadding": true}`,
   *       '_blank',
   *       'noreferrer',
   *     );
   *   } else {
   *     alert(`${numPages} is not recognized as a number! Please try again.`);
   *   }
   * };
   */

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
    const isPro = document.getElementById('proHolder').innerText === 'true';
    const isAdmin = document.getElementById('adminHolder').innerText === 'true';
    const basicBatchAccess = isAdmin || isPro;
    const pageID = Number.parseInt(document.getElementById('pageIDHolder').innerText);

    try {
      const tags = document.getElementById('pageTagsHolder').innerText;
      const downloadEntry = await getDownloadsAvailability();
      const topicGuide = tags.includes('"article:topic-guide"');
      const isChapter = (
        (!downloadEntry && topicGuide)
        || (downloadEntry && downloadEntry.id !== pageID && topicGuide)
      );
      const fullBook = await getBook();
      const exportFragment = document.createDocumentFragment(); // create in a vDOM first
      const exportContainer = document.createElement('div');
      exportContainer.id = ID_CONTAINER_DIV;

      /* PDF Export Dropdown */
      const pdfExportOptions = [];

      /* Full PDF Download */
      if (fullBook) {
        LibreTexts.current.downloads.pdf.full = fullBook;
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
        // Shapeshift has no direct single-page download, so compile this page on demand
        // via the job flow (opens in a new tab when complete).
        pdfExportOptions.push({
          text: 'Page',
          title: 'Get a PDF of this page (opens in a new tab when complete)',
          listener: (e) => {
            e.preventDefault();
            batch();
          },
        });
      }
      /* Compile Book (Page + Subpages) */
      if (basicBatchAccess && pdfExportOptions.length > 0) { // don't add option if non-content
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
      /*
       * The legacy "Compile Full" option forced a no-cache full recompile via
       * batch.libretexts.org. Shapeshift has no cache-control, so this option is dropped;
       * "Compile Book" above submits a standard job that covers recompilation.
       */

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
        const bookID = getBookID();
        const bookstoreURL = `https://commons.libretexts.org/store/product/${currentSubdomain}-${currentCoverpage.id}`;

        const downloadOptions = [
          {
            key: 'full',
            text: 'Full PDF',
            title: 'Download Full PDF',
            href: getDownloadURL(bookID, 'pdf'),
            icon: 'mt-icon-file-pdf',
          },
          {
            key: 'lms',
            text: 'Import into LMS (Thin CC)',
            title: 'Download Thin CC File for LMS Import',
            href: getDownloadURL(bookID, 'thincc'),
            icon: 'mt-icon-graduation',
          },
          {
            key: 'zip',
            text: 'Individual ZIP',
            title: 'Download ZIP of Individual Pages',
            href: getDownloadURL(bookID, 'pages'),
            icon: 'mt-icon-file-zip',
          },
          ...(downloadEntry.zipFilename && [
            {
              key: 'bookstore',
              text: 'Buy Print Copy',
              title: 'Buy Print Copy (opens in new tab)',
              href: bookstoreURL,
              icon: 'mt-icon-book2',
            }
          ]),
          {
            key: 'publication',
            text: 'Print Book Files',
            title: 'Download Publication Files',
            href: getDownloadURL(bookID, 'publication'),
            icon: 'mt-icon-book3',
          },
        ];

        downloadOptions.forEach((option) => {
          LibreTexts.current.downloads[option.key] = option.href;
        });

        const downloadsInfoAvailable = new Event('libre-downloadsinfoavailable', {
          cancelable: true,
        });
        window.dispatchEvent(downloadsInfoAvailable);

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

        /* Also add "Buy Print Copy" as a standalone button */
        if(downloadEntry.zipFilename){
          const buyPrintCopyLink = document.createElement('a');
          Object.assign(buyPrintCopyLink, {
            title: 'Buy Print Copy (opens in new tab)',
            href: bookstoreURL,
            target: '_blank',
            rel: 'noreferrer',
            classList: CLASS_BUY_PRINT_COPY_BTN,
            id: 'buyPrintCopy',
            ariaLabel: 'Buy Print Copy',
          });

          buyPrintCopyLink.classList.add(CLASS_BUY_PRINT_COPY_BTN);

          // Create the span element for the icon
          const iconSpan = document.createElement('span');
          iconSpan.classList.add('mt-icon-book2', `${CLASS_BUY_PRINT_COPY_BTN}-icon-span`); // Add the icon class
          iconSpan.setAttribute('aria-hidden', 'true');

          // Create the text node
          const buttonText = document.createTextNode(' Buy Print Copy'); // Space for separation

          // Append icon and text to the button
          buyPrintCopyLink.appendChild(iconSpan);
          buyPrintCopyLink.appendChild(buttonText);

          exportContainer.appendChild(buyPrintCopyLink);
        }
      }

      /* LibreCommons tools/buttons */
      const commonsEntry = await getBookCommonsEntry();
      if (commonsEntry) {
        const commonsURL = `https://commons.libretexts.org/book/${commonsEntry.bookID}`;

        /**
         * Opens the text's LibreCommons Catalog entry page in a new tab with the Adoption Report
         * tool open.
         *
         * @param {MouseEvent|KeyboardEvent} e - The event that triggered the handler. 
         */
        const openAdoptionReport = (e) => {
          e.preventDefault();
          window.open(`${commonsURL}?adoptionreport=show`, '_blank', 'noreferrer');
        };

        /**
         * Opens the text's LibreCommons Catalog entry page in a new tab with the Peer Review
         * submission form open.
         *
         * @param {MouseEvent|KeyboardEvent} e - The event that triggered the handler. 
         */
        const openPeerReview = (e) => {
          e.preventDefault();
          window.open(`${commonsURL}?peerreview=show`, '_blank', 'noreferrer');
        };

        /**
         * Opens the text's associated ADAPT course in a new tab using anonymous access.
         *
         * @param {MouseEvent|KeyboardEvent} e - The event that triggered the handler. 
         */
        const openADAPTCourse = (e) => {
          e.preventDefault();
          window.open(
            `https://adapt.libretexts.org/courses/${commonsEntry.adaptCourseID}/anonymous`,
            '_blank',
            'noreferrer',
          );
        };

        /**
         * Opens the text's LibreCommons Catalog entry page in a new tab with the Ancillary
         * Materials viewer open.
         *
         * @param {MouseEvent|KeyboardEvent} e - The event that triggered the handler. 
         */
        const openAncillaryMaterials = (e) => {
          e.preventDefault();
          window.open(`${commonsURL}?materials=show`, '_blank', 'noreferrer');
        };


        const reviewOptions = [{
          text: 'Submit Adoption Report',
          title: 'Submit an Adoption Report for this text (opens in new tab)',
          listener: (e) => {
            e.preventDefault();
            openAdoptionReport(e);
          },
          icon: "mt-icon-user-activity"
        }];

        if(commonsEntry.hasPeerReviews || commonsEntry.allowAnonPR){
          reviewOptions.push({
            text: 'Submit a Peer Review',
            title: 'Submit a Peer Review for this text (opens in new tab)',
            listener: (e) => {
              e.preventDefault();
              openPeerReview(e);
            },
            icon: "mt-icon-support-man"
          })
        }

        exportContainer.appendChild(createDropdown({
          dropdownClass: CLASS_DROPDOWN,
          dropdownBtnId: ID_REVIEW_DROPDOWN_BTN,
          dropdownBtnClass: CLASS_REVIEW_DROPDOWN_ITEM,
          dropdownBtnTitle: 'Review & Adopt Options',
          dropdownText: 'Review / Adopt',
          dropdownOptsId: ID_REVIEW_DROPDOWN_CONTENT,
          dropdownOptsOpenClass: CLASS_DROPDOWN_OPEN_STATE,
          dropdownOptsBtnClass: CLASS_REVIEW_DROPDOWN_ITEM,
          dropdownOptsBtnTxtClass: CLASS_BUTTON_ICON_TEXT,
          dropdownOptions: reviewOptions,
        }));

        if (commonsEntry.hasAdaptCourse) {
          const adaptButton = document.createElement('button');
          Object.assign(adaptButton, {
            id: ID_COMMONS_ADAPT_BTN,
            title: 'View ADAPT Homework Resources (opens in new tab)',
            type: 'button',
            tabIndex: 0,
          });
          adaptButton.appendChild(document.createTextNode('Homework'));
          adaptButton.addEventListener('click', openADAPTCourse);
          adaptButton.addEventListener('keydown', (e) => {
            if (e.key === ENTER_KEY) openADAPTCourse(e);
          });
          exportContainer.appendChild(adaptButton);
        }

        if (commonsEntry.hasMaterials) {
          const materialsButton = document.createElement('button');
          Object.assign(materialsButton, {
            id: ID_COMMONS_MATERIALS_BTN,
            title: 'View Ancillary Materials (opens in new tab)',
            type: 'button',
            tabIndex: 0,
          });
          materialsButton.appendChild(document.createTextNode('Ancillary Materials'));
          materialsButton.addEventListener('click', openAncillaryMaterials);
          materialsButton.addEventListener('keydown', (e) => {
            if (e.key === ENTER_KEY) openAncillaryMaterials(e);
          });
          exportContainer.appendChild(materialsButton);
        }

        /* Add Commons button */
        const commonsButton = document.createElement('a');
        Object.assign(commonsButton, {
          id: ID_COMMONS_BTN,
          ariaLabel: 'View LibreCommons Catalog Entry (opens in new tab)',
          title: 'View LibreCommons Catalog Entry (opens in new tab)',
          type: 'button',
          target: '_blank',
          rel: 'noreferrer',
          href: commonsURL,
        });
        commonsButton.appendChild(document.createTextNode('View on Commons'));
        exportContainer.appendChild(commonsButton);
      }

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

        // Create the span element for the icon
        const donateIconSpan = document.createElement('span');
        donateIconSpan.classList.add('mt-icon-support-hands', '.donate-icon-span'); // Add the icon class
        donateIconSpan.setAttribute('aria-hidden', 'true');
        donorBoxLink.appendChild(donateIconSpan);

        // Create the text node
        donorBoxLink.appendChild(document.createTextNode(' Donate')); // Space for separation

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

      const conductorProjectID = await getBookProjectID();
      if(conductorProjectID && isPro){
        /* Add Conductor Project button */
        const conductorButton = document.createElement('a');
        Object.assign(conductorButton, {
          id: ID_CONDUCTOR_PROJECT_BTN,
          ariaLabel: 'View Conductor Project (opens in new tab)',
          title: 'View Conductor Project (opens in new tab)',
          type: 'button',
          target: '_blank',
          rel: 'noreferrer',
          href: `https://conductor.libretexts.org/projects/${conductorProjectID}`,
        });

        // const openConductorProject = (e) => {
        //   e.preventDefault();
        //   window.open(`https://commons.libretexts.org/projects/${conductorProjectID}`, '_blank', 'noreferrer');
        // }

        // conductorButton.addEventListener('click', openConductorProject);
        // conductorButton.addEventListener('keydown', (e) => {
        //   if (e.key === ENTER_KEY) openConductorProject(e);
        // });

        conductorButton.appendChild(document.createTextNode('Conductor Project'));
        exportContainer.appendChild(conductorButton);
      }

      /* Styles */
      const commonButtonStyles = `
        color: #FFFFFF !important;
        border: none !important;
        border-radius: 0.25em !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 35px !important;
        box-shadow: none !important;
      `;
      const dropdownListStyles = `
        display: block !important;
        z-index: 1000;
        position: absolute;
        width: 150px;
      `;
      const dropdownOptionsStyles = `
        width: 150px !important;
        border: none !important;
        border-radius: 0.25em !important;
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
          gap: 0.25em;
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
        #${ID_COMMONS_BTN}, #${ID_COMMONS_BTN} {
          background-color: #088A20 !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
          ${commonButtonStyles}
        }
        #${ID_REVIEW_DROPDOWN_BTN} {
          background-color: #CD4D12 !important;
          ${commonButtonStyles}
        }
        #${ID_REVIEW_DROPDOWN_BTN}:focus {
          border: 3px solid #30B3F6 !important;
        }
        #${ID_REVIEW_DROPDOWN_CONTENT} {
          display: none;
          background-color: #CD4D12;
          color: #FFFFFF;
          font-size: 14px;
        }
        #${ID_REVIEW_DROPDOWN_CONTENT}.${CLASS_DROPDOWN_OPEN_STATE} {
          ${dropdownListStyles}
        }
        .${CLASS_REVIEW_DROPDOWN_ITEM}, .${CLASS_REVIEW_DROPDOWN_ITEM}:hover {
          background-color: #CD4D12 !important;
          ${dropdownOptionsStyles}
        }
        .${CLASS_REVIEW_DROPDOWN_ITEM}:hover {
          background-color: #a13706 !important;
        }
        .${CLASS_REVIEW_DROPDOWN_ITEM}:not(:first-child) {
          border-top: 1px solid white !important;
        }
        .${CLASS_REVIEW_DROPDOWN_ITEM}:focus {
          border: 3px solid #0B0115 !important;
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
        #${ID_COMMONS_ADOPTIONREPORT_BTN}, #${ID_COMMONS_ADOPTIONREPORT_BTN} {
          background-color: #088A20 !important;
          ${commonButtonStyles}
        }
        #${ID_COMMONS_ADOPTIONREPORT_BTN}:focus {
          border: 3px solid #30B3F6 !important;
        }
        #${ID_COMMONS_PEERREVIEW_BTN}, #${ID_COMMONS_PEERREVIEW_BTN} {
          background-color: #CD4D12 !important;
          ${commonButtonStyles}
        }
        #${ID_COMMONS_PEERREVIEW_BTN}:focus {
          border: 3px solid #30B3F6 !important;
        }
        #${ID_COMMONS_ADAPT_BTN}, #${ID_COMMONS_ADAPT_BTN} {
          background-color: #088488 !important;
          ${commonButtonStyles}
        }
        #${ID_COMMONS_ADAPT_BTN}:focus {
          border: 3px solid #30B3F6 !important;
        }
        #${ID_COMMONS_MATERIALS_BTN}, #${ID_COMMONS_MATERIALS_BTN} {
          background-color: #2E79C6 !important;
          ${commonButtonStyles}
        }
        #${ID_COMMONS_MATERIALS_BTN}:focus {
          border: 3px solid #30B3F6 !important;
        }
        #${ID_CONDUCTOR_PROJECT_BTN}, #${ID_CONDUCTOR_PROJECT_BTN} {
          background-color: #2441E7 !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
          ${commonButtonStyles}
        }
        #${ID_CONDUCTOR_PROJECT_BTN}:focus {
          border: 3px solid #30B3F6 !important;
        }
        .${CLASS_BUY_PRINT_COPY_BTN} {
          background-color: #57116A !important;
          color: #FFFFFF !important;
          border: none !important;
          border-radius: 0.25em !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 8px !important;
          height: 19px !important;
          box-shadow: none !important;
          gap: 6px !important;
        }
        .${CLASS_BUY_PRINT_COPY_BTN}-icon-span {
          padding-top: 3px
        }
        #donate {
          padding: 8px !important;
          border-radius: 0.25em !important;
          height: 19px !important;
          gap: 6px !important;
        }
        .donate-icon-span {
          padding-top: 3px
        }
      </style>
    `);

      /* Add buttons to DOM */
      exportFragment.appendChild(exportContainer);
      const cxSocialShare = document.querySelector('.elm-social-share');
      if (cxSocialShare) {
        cxSocialShare.replaceChildren(exportFragment);
      }

      /*
       * The TOC link is not yet supported by Shapeshift (no toc endpoint exists in the API).
       * The legacy batch.libretexts.org implementation is preserved below, commented out, so
       * it can be revived if/when Shapeshift adds an equivalent.
       *
       * const url = window.location.href.replace(/#$/, '');
       * const getTOCLink = document.getElementById('getTOCLink');
       * if (getTOCLink) {
       *   getTOCLink.rel = 'noopener nofollow';
       *   getTOCLink.href = `https://batch.libretexts.org/print/toc=${url}`;
       * }
       */
    } catch (e) {
      console.error(`[ExportButtons]: ${e.toString()}`);
    }

    LibreTexts.active.exportButtons = true;
    /* attach functions to global namespace */
    LibreTexts.batch = batch;
    // LibreTexts.cover = cover; // disabled: Shapeshift has no cover endpoint (see above)
  };

  window.addEventListener('load', loadExportButtons);
}
