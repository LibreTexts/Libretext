/**
 * licensecontrol.js
 *
 * @file Defines helper functions for retrieving license information across LibreTexts services
 * or labeling a page with license information and icons.
 * @author LibreTexts
 */

/**
 * LicenseInfo object definition.
 *
 * @typedef {object} LicenseInfo
 * @property {string} label - The license's identifier for label/image rendering.
 * @property {string} title - The license's human-readable, presentation-ready title/name.
 * @property {string} link - A link to further information or the license's definition.
 * @property {string} [version] - The license version, if applicable.
 * @property {string} raw - The raw, internal LibreTexts license identifier.
 */

/**
 * Returns information about a content license, either via a passed identifier or reading the
 * current page's tags.
 *
 * @param {string} [inputTag] - A LibreTexts page tag containing a license identifier.
 * @returns {LicenseInfo} Information about the specified license.
 */
function getCC(inputTag) {
  let tags = [];
  if (typeof (inputTag) === 'string') {
    tags = [inputTag.startsWith('license:') ? inputTag : `license:${inputTag}`];
  } else {
    let tagsHolder = document.getElementById('pageTagsHolder');
    if (tagsHolder) {
      tagsHolder = tagsHolder.innerText;
      tagsHolder = tagsHolder.replace(/\\/g, '');
      tags = JSON.parse(tagsHolder);
    }
  }
  if (Array.isArray(tags)) {
    let license = '';
    let licenseVersion = '4.0'; // default to 4.0
    tags.forEach((item) => {
      if (typeof (item) === 'string' && item.includes('license')) {
        const tagRaw = item.split(':');
        if (Array.isArray(tagRaw) && tagRaw.length > 1) {
          const [tagName, tagVal] = tagRaw;
          if (tagName === 'license') {
            license = tagVal;
          } else if (tagName === 'licenseversion' && tagVal.length === 2) {
            licenseVersion = `${tagVal.slice(0, 1)}.${tagVal.slice(1)}`;
          }
        }
      }
    });
    if (license.length > 0) {
      switch (license) {
        case 'publicdomain':
          return {
            label: 'cc-publicdomain',
            title: 'Public Domain',
            link: 'https://en.wikipedia.org/wiki/Public_domain',
            raw: 'publicdomain',
          };
        case 'ccby':
          return {
            label: 'cc-BY',
            title: 'CC BY',
            link: `https://creativecommons.org/licenses/by/${licenseVersion}/`,
            version: licenseVersion,
            raw: 'ccby',
          };
        case 'ccbysa':
          return {
            label: 'cc-by-sa',
            title: 'CC BY-SA',
            link: `https://creativecommons.org/licenses/by-sa/${licenseVersion}/`,
            version: licenseVersion,
            raw: 'ccbysa',
          };
        case 'ccbyncsa':
          return {
            label: 'cc-by-nc-sa',
            title: 'CC BY-NC-SA',
            link: `https://creativecommons.org/licenses/by-nc-sa/${licenseVersion}/`,
            version: licenseVersion,
            raw: 'ccbyncsa',
          };
        case 'ccbync':
          return {
            label: 'cc-by-nc',
            title: 'CC BY-NC',
            link: `https://creativecommons.org/licenses/by-nc/${licenseVersion}/`,
            version: licenseVersion,
            raw: 'ccbync',
          };
        case 'ccbynd':
          return {
            label: 'cc-by-nd',
            title: 'CC BY-ND',
            link: `https://creativecommons.org/licenses/by-nd/${licenseVersion}/`,
            version: licenseVersion,
            raw: 'ccbynd',
          };
        case 'ccbyncnd':
          return {
            label: 'cc-by-nc-nd',
            title: 'CC BY-NC-ND',
            link: `https://creativecommons.org/licenses/by-nc-nd/${licenseVersion}/`,
            version: licenseVersion,
            raw: 'ccbyncnd',
          };
        case 'gnu':
          return {
            label: 'gnu',
            title: 'GNU GPL',
            link: 'https://www.gnu.org/licenses/gpl-3.0.en.html',
            raw: 'gnu',
          };
        case 'gnudsl':
          return {
            label: 'gnudsl',
            title: 'GNU DSL',
            link: 'https://www.gnu.org/licenses/dsl.html',
            raw: 'gnudsl',
          };
        case 'gnufdl':
          return {
            label: 'gnufdl',
            title: 'GNU FDL',
            link: 'https://www.gnu.org/licenses/fdl-1.3.en.html',
            raw: 'gnufdl',
          };
        case 'arr':
          return {
            label: 'arr',
            title: 'All Rights Reserved ©',
            link: 'https://en.wikipedia.org/wiki/All_rights_reserved',
            raw: 'arr',
          };
        default:
          break;
      }
    }
  }
  return {
    label: 'notset',
    title: 'notset',
    link: '#',
    raw: 'notset',
  };
}

/**
 * Labels a page with information about its content licensing and implements
 * a warning modal for copying/pasting protected content.
 */
function licenseControl() {
  /* Append the warning modal to the page */
  $('body').append('<div id="warningModal"><div id="warningModalContent"></div></div>');

  const warnModal = document.getElementById('warningModal');
  const warnModalContent = document.getElementById('warningModalContent');

  /**
   * Helper to prevent pasting content on the current page.
   * Triggers warning to user if pasting is attempted.
   */
  function preventPaste() {
    $('body').bind('paste', (e) => {
      e.preventDefault();
      alert('Pasting is not allowed on this page.');
    });
  }

  /**
   * Helper to prevent copying content from the current page.
   */
  function preventCopy() {
    $('body').bind('copy', (e) => e.preventDefault());
  }

  /**
   * Compares the current page's license with the license of content from a
   * previous page and warns the user and/or prevents copying/pasting if necessary.
   *
   * @param {LicenseInfo} [licInfo] - An object with information about the current page's license.
   */
  function ccCompare(licInfo) {
    let license;
    if (typeof (licInfo) === 'object') {
      license = licInfo;
    } else {
      license = getCC();
    }
    const licenses = {
      'cc-publicdomain': 1,
      'cc-BY': 2,
      'cc-by-sa': 3,
      'cc-by-nc-sa': 4,
      'cc-by-nc': 5,
      'cc-by-nd': 6,
      'cc-by-nc-nd': 7,
      gnu: 8,
      gnudsl: 9,
      gnufdl: 10,
      arr: 11,
      notset: 12,
    };
    const licLabel = license.label;
    const licStored = localStorage.getItem('cc');

    if (licenses[licLabel]) preventCopy(); // prevent copying ARR content

    if (licStored) {
      console.log(`#${licenses[licStored]} => #${licenses[licLabel]}`);
      switch (licenses[licStored]) {
        case 1:
          switch (licenses[licLabel]) {
            case 6:
            case 7:
              preventPaste();
              break;
            case 11:
            case 12:
              console.log('Paste with warning');
              break;
            default:
              break;
          }
          break;
        case 2:
          switch (licenses[licLabel]) {
            case 1:
              console.log('Paste and switch CC-BY');
              break;
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
              preventPaste();
              break;
            case 12:
              console.log('Paste with warning');
              break;
            default:
              break;
          }
          break;
        case 3:
          switch (licenses[licLabel]) {
            case 1:
            case 12:
              console.log('Paste and switch');
              break;
            case 3:
              break;
            default:
              preventPaste();
              break;
          }
          break;
        case 4:
          switch (licenses[licLabel]) {
            case 1:
            case 2:
            case 5:
              console.log('Paste and switch CC-BY-NC-SA');
              break;
            case 3:
            case 6:
            case 7:
            case 10:
            case 11:
              preventPaste();
              break;
            default:
              break;
          }
          break;
        case 5:
          switch (licenses[licLabel]) {
            case 1:
            case 2:
              console.log('Paste and switch');
              break;
            case 5:
              break;
            case 12:
              console.log('Paste with warning');
              break;
            default:
              preventPaste();
              break;
          }
          break;
        case 6:
        case 7:
          switch (licenses[licLabel]) {
            case 1:
            case 12:
              console.log('Paste, warn, and switch');
              break;
            default:
              preventPaste();
              break;
          }
          break;
        case 11:
          switch (licenses[licLabel]) {
            default:
              preventPaste();
              break;
          }
          break;
        default:
          break;
      }
    }
  }

  /**
   * Detects if a user copies content and opens a warning modal with information about the
   * content's license restrictions.
   *
   * @param {LicenseInfo} [licInfo] - An object with information about the current page's
   * license.
   */
  // eslint-disable-next-line no-unused-vars
  function ccDetect(licInfo) {
    let license;
    if (typeof (licInfo) === 'object') {
      license = licInfo;
    } else {
      license = getCC();
    }
    ccCompare(license);
    if (typeof (license) === 'object') {
      const attribStyle = 'background-color: #aed581';
      const warningStyle = 'background-color: #fff176';
      const dangerStyle = 'background-color: #f44336';

      const licLink = `<a href="${license.link}" target="_blank" rel="noopener noreferrer">here</a>`;
      const titleText = `The content you just copied is ${license.title} licensed:`;
      switch (license.label) {
        case 'cc-BY':
          warnModalContent.setAttribute('style', attribStyle);
          warnModalContent.innerHTML = `<span> ${titleText} You can can remix and distribute the work as long as proper attribution is given. Learn more about this license ${licLink}.</span>`;
          break;
        case 'cc-by-sa':
          warnModalContent.setAttribute('style', warningStyle);
          warnModalContent.innerHTML = `<span> ${titleText} You can remix and distribute the work as long as proper attribution is given and your work also comes with this same license. Learn more about this license ${licLink}.</span>`;
          break;
        case 'cc-by-nc-sa':
          warnModalContent.setAttribute('style', warningStyle);
          warnModalContent.innerHTML = `<span> ${titleText} You can remix and distribute the work without profit as long as proper attribution is given and your work also comes with this same license. Learn more about this license ${licLink}.</span>`;
          break;
        case 'cc-by-nc':
          warnModalContent.setAttribute('style', warningStyle);
          warnModalContent.innerHTML = `<span> ${titleText} You can remix and distribute the work without profit as long as proper attribution is given. Learn more about this license ${licLink}.</span>`;
          break;
        case 'cc-by-nd':
          warnModalContent.setAttribute('style', dangerStyle);
          warnModalContent.innerHTML = `<span> ${titleText} You can share the work if proper attribution is given, but cannot modify it in any way. Learn more about this license ${licLink}.</span>`;
          break;
        case 'cc-by-nc-nd':
          warnModalContent.setAttribute('style', dangerStyle);
          warnModalContent.innerHTML = `<span> ${titleText} You can share the work without profit if proper attribution is given, but cannot modify it in any way. Learn more about this license ${licLink}.</span>`;
          break;
        case 'gnu':
          warnModalContent.setAttribute('style', warningStyle);
          warnModalContent.innerHTML = `<span> ${titleText} licensed: You have the freedom to run, study, share and modify the software. Learn more about this license ${licLink}.</span>`;
          break;
        case 'gnudsl':
          warnModalContent.setAttribute('style', dangerStyle);
          warnModalContent.innerHTML = `<span> ${titleText} licensed: You have the freedom to run and remix software without profit. Learn more about this license ${licLink}.</span>`;
          break;
        case 'gnufdl':
          warnModalContent.setAttribute('style', warningStyle);
          warnModalContent.innerHTML = `<span> ${titleText} licensed: You have the freedom to run but not remix any software for profit. Learn more about this license ${licLink}.</span>`;
          break;
        case 'arr':
          warnModalContent.setAttribute('style', dangerStyle);
          warnModalContent.innerHTML = '<span> The license of the content on this page is All Rights Reserved. The content is allowed to be used on the LibreTexts platform thanks to the author. Usage off the platform requires explicit permission from the content authors.</span>';
          break;
        case 'notset':
          warnModalContent.innerHTML = '<span> The license of the content on this page is unselected. Please review the Contributors and Attributions section or the content author(s) for clarification of the applicable license(s). </span>';
          break;
        default: // public domain
          break;
      }
      document.addEventListener('copy', () => {
        $(warnModal).show();
        localStorage.setItem('cc', license.label);
        console.log(`cc cookie: ${license.label}`);
      });
    }
  }

  /**
   * Adds the current page's license labeling (icon/image) to the DOM.
   *
   * @param {LicenseInfo} licInfo - An object with information about the current page's license.
   */
  function ccPageLabel(licInfo) {
    const isAdmin = document.getElementById('adminHolder').innerText === 'true';
    let license;
    if (typeof (licInfo) === 'object') {
      license = licInfo;
    } else {
      license = getCC();
    }
    if (typeof (license) === 'object') {
      const pageLabel = document.createElement('li');
      pageLabel.classList.add('pageInfo');
      let licIcon = '';
      switch (license.label) {
        case 'gnu':
          licIcon = '<img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/gpl.png" alt="GNU General Public License"/>';
          break;
        case 'gnudsl':
          licIcon = '<span style="color: black; font-size: small">GNU Design Science License</span>';
          break;
        case 'gnufdl':
          licIcon = '<img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/gfdl.png" alt="GNU Free Documentation License"/>';
          break;
        case 'arr':
          licIcon = '<img style="height: 30px" src="https://awesomefiles.libretexts.org/Social Share Kit/arr.png" alt="All Rights Reserved"/>';
          break;
        case 'notset':
          licIcon = '<span></span>';
          break;
        default: // CC licenses
          licIcon = `<i class="cc ${license.label}"></i>`;
          break;
      }
      const licLinkStart = `<a style="width: max-content; width: -moz-max-content; overflow: initial; font-size: 30px;" href="${license.link}" target="_blank" rel="noopener noreferrer">${licIcon}</a>`;
      pageLabel.innerHTML = `<span>${licLinkStart}</span>`;

      /** Add the label to DOM */
      if ($('li.elm-last-modified').length > 0) {
        $('li.elm-last-modified')[0].before(pageLabel);
      } else {
        pageLabel.style.display = 'none';
      }
    }

    /** Add page number to DOM */
    const pageNumHolder = document.getElementById('pageNumberHolder');
    if ($('li.elm-page-restriction').length > 0) {
      $('li.elm-page-restriction')[0].after(pageNumHolder);
    } else if (window.location.host.startsWith('query') && $('li.elm-last-modified').length > 0) {
      $('li.elm-last-modified')[0].after(pageNumHolder);
    } else {
      pageNumHolder.style.display = 'none';
    }

    /** Create batch print options and DonorBox links (if applicable) */
    if ($('.elm-social-share').length > 0) {
      let batchHTML = '<div class="ssk-group optimize"><div id="batchPrint"></div>';
      if (!isAdmin) {
        batchHTML += '<a href="https://donorbox.org/libretexts" target="_blank" rel="noopener noreferrer" class="custom-dbox-popup notSS" id="donate"><span>Donate</span></a>';
        window.DonorBox = {
          widgetLinkClassName: 'custom-dbox-popup',
        };
      }
      $('.elm-social-share')[0].innerHTML = `${batchHTML}</div>`;
    }

    /** Enable DonorBox */
    if (!isAdmin) {
      const donorScript = document.createElement('script');
      donorScript.type = 'text/javascript';
      donorScript.src = 'https://donorbox.org/install-popup-button.js';
      if (document.getElementById('donate')) {
        document.getElementById('donate').append(donorScript);
      }
    }
  }

  /**
   * Hide the licensing warning modal on click outside.
   */
  window.addEventListener('click', (e) => {
    if (e.target === warnModal) $(warnModal).hide();
  });

  /**
   * TODO: Reinstate ccDetect();
   * const isAdmin = document.getElementById('adminHolder').innerText === 'true';
   * const isPro = document.getElementById('proHolder').innerText === 'true';
   * const groups = document.getElementById('groupHolder').innerText.toLowerCase();
   * if (!admin && !pro && !groups.includes('developer))
   */

  /* Trigger page labeling */
  ccPageLabel();
}

/** Trigger page labeling & license detection on page load */
document.addEventListener('DOMContentLoaded', licenseControl);
