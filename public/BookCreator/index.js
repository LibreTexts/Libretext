/**
 * @file Enables a modal tool to allow authors to quickly create a new book with basic structure.
 * @author LibreTexts <info@libretexts.org>
 */

import './index.css';
import MicroModal from 'micromodal';
import modalHTML from './index.html';

const MODAL_ID = 'book-creator';
const MODAL_CONTENT_CONTAINER_ID = 'book-creator__container';
const FORM_ID = 'book-creator__form';
const FORM_INPUT_ID = 'book-creator__title_input';
const LOADER_ID = 'book-creator__loader';
const LOADER_ACTIVE_CLASS = 'is_loading';
const FORM_ERROR_CLASS = 'book-creator__form_error';
const FORM_HIDE_CLASS = 'book-creator__form_hidden';

let titleInput = null;
let form = null;

/**
 * Inserts the modal into the DOM (if not already present) and attaches event listeners.
 */
function insertModalAndHydrate() {
  if (LibreTexts.active?.bookCreator) {
    return;
  }

  const modalTemplate = document.createElement('template');
  modalTemplate.innerHTML = modalHTML;
  document.body.appendChild(modalTemplate.content);
  LibreTexts.active.bookCreator = true;

  form = document.getElementById(FORM_ID);
  if (!form) {
    console.error('[BookCreator] Form element not found in DOM!');
    return;
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitCreateBook();
  });
}

/**
 * Validates form inputs and activates error states/classes, if necessary.
 *
 * @returns {boolean} True if all inputs valid, false otherwise.
 */
function validateForm() {
  let valid = true;
  const titleValue = titleInput.value;
  if (!titleValue || titleValue.trim().length < 1 || titleValue.trim().length > 125) {
    valid = false;
    titleInput.classList.add(FORM_ERROR_CLASS);
    titleInput.setAttribute('aria-invalid', 'true');
  }
  return valid;
}

/**
 * Resets all form error states/classes.
 */
function resetFormErrors() {
  titleInput.classList.remove(FORM_ERROR_CLASS);
  titleInput.setAttribute('aria-invalid', 'false');
}

/**
 * Activates form validation, then enables loading state and submits the request to the
 * server. Window redirects to the new book's URL if successful.
 */
async function submitCreateBook() {
  titleInput = document.getElementById(FORM_INPUT_ID);
  if (!titleInput) {
    window.alert('Sorry, we encountered an error reading your input.');
    return;
  }

  resetFormErrors();
  if (!validateForm()) {
    return;
  }

  try {
    const contentContainer = document.getElementById(MODAL_CONTENT_CONTAINER_ID);
    const loader = document.getElementById(LOADER_ID);
    if (contentContainer) {
      contentContainer.setAttribute('aria-busy', 'true');
    }
    if (loader) {
      loader.classList.add(LOADER_ACTIVE_CLASS);
      form.classList.add(FORM_HIDE_CLASS);
    }

    const createRes = await LibreTexts.sendAPI('createBook', { title: titleInput.value }, 'POST');
    const create = await createRes.json();
    if (!create.data?.url) {
      throw (new Error('New URL not provided.'))
    }

    window.location.href = create.data.url;
  } catch (e) {
    console.error(e);
    window.alert('Sorry, we seem to have encountered an error. Please refresh and try again.');
  }
}

/**
 * Adds the Book Creator modal to the DOM, adds event listeners, and 
 */
function bookCreator() {
  insertModalAndHydrate();
  MicroModal.show(MODAL_ID);
}

LibreTexts.bookCreator = bookCreator;
