import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

export default function PolyglotEngine() {

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  // Form Data
  const [url, setURL] = useState('');
  const [language, setLanguage] = useState('uk');
  const [targetPath, setTargetPath] = useState('');
  const [notify, setNotify] = useState('');
  const [password, setPassword] = useState('');

  // Form State
  const [urlErr, setURLErr] = useState(false);
  const [languageErr, setLanguageErr] = useState(false);
  const [targetPathErr, setTargetPathErr] = useState(false);
  const [notifyErr, setNotifyErr] = useState(false);
  const [passwordVis, setPasswordVis] = useState(false);
  const [passwordErr, setPasswordErr] = useState(false);

  /**
   * Checks that an object is both a string and is non-empty (excluding whitespace).
   *
   * @param {string} str - The string to verify. 
   * @returns {boolean} True if non-empty string, false otherwise.
   */
  function isNonEmptyString(str) {
    return typeof (str) === 'string' && str?.trim().length > 0;
  }

  /**
   * Resets all error states in the form.
   */
  function resetFormErrors() {
    setURLErr(false);
    setLanguageErr(false);
    setTargetPathErr(false);
    setNotifyErr(false);
    setPasswordErr(false);
  }

  /**
   * Validates all fields in the form. Error states are set on invalid fields, if any.
   *
   * @returns {boolean} True if all fields valid, false otherwise.
   */
  function validateRequest() {
    let valid = true;
    if (!isNonEmptyString(url)) {
      valid = false;
      setURLErr(true);
    }
    if (!isNonEmptyString(language) || language.length > 5) {
      valid = false;
      setLanguageErr(true);
    }
    if (!isNonEmptyString(targetPath)) {
      valid = false;
      setTargetPathErr(true);
    }
    if (isNonEmptyString(notify) && !notify.includes('@')) {
      valid = false;
      setNotifyErr(true);
    }
    if (!isNonEmptyString(password)) {
      valid = false;
      setPasswordErr(true);
    }
    return valid;
  }

  /**
   * Submits the request to the Engine, then enters the output into state.
   */
  async function handleSubmitClick() {
    resetFormErrors();
    if (validateRequest()) {
      setLoading(true);
      const params = new URLSearchParams({
        targetpath: targetPath,
        url,
        language,
        ...(isNonEmptyString(notify) && {
          notify,
        }),
      });
      const reqAddr = `https://5x6elpxme1.execute-api.us-east-1.amazonaws.com/alpha/translate-async?${params.toString()}`;
      try {
        const submit = await fetch(reqAddr, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${password}`,
          },
        });
        if (submit.ok) {
          const response = await submit.json();
          setOutput(response);
        } else if (submit.status === 401) {
          alert('Incorrect password!');
        } else {
          alert('Unknown error occurred! Check logs.');
        }
      } catch (e) {
        console.error(e);
        alert('Error submitting request! Check logs.');
      }
      setLoading(false);
    }
  }

  /**
   * Updates the URL field with newly-entered value.
   *
   * @param {React.ChangeEvent} e - The event that activated the handler.
   */
  function handleURLChange(e) {
    setURL(e.target.value);
  }

  /**
   * Updates the Langauge field with newly-entered value.
   *
   * @param {React.ChangeEvent} e - The event that activated the handler.
   */
  function handleLanguageChange(e) {
    setLanguage(e.target.value);
  }

  /**
   * Updates the Target Path field with newly-entered value.
   *
   * @param {React.ChangeEvent} e - The event that activated the handler.
   */
  function handleTargetChange(e) {
    setTargetPath(e.target.value);
  }

  /**
   * Updates the Notify Addresses field with newly-entered value.
   *
   * @param {React.ChangeEvent} e - The event that activated the handler.
   */
  function handleNotifyChange(e) {
    setNotify(e.target.value);
  }

  /**
   * Updates the Password field with newly-entered value.
   *
   * @param {React.ChangeEvent} e - The event that activated the handler.
   */
  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  /**
   * Toggles the Password field visibility setting.
   *
   * @param {React.ChangeEvent} _e - The event that activated the handler.
   */
  function handlePasswordVisClick(_e) {
    setPasswordVis(!passwordVis);
  }

  /**
   * Suppresses the default action of a given DOM event.
   *
   * @param {React.SyntheticEvent} e - The event that activated the handler.
   */
  function preventDefault(e) {
    e.preventDefault();
  }

  return (
    <div id="PolyglotEngine">
      <div className="topPanel">
        <div>
          <p>
            <strong>Note:</strong>
            {` As of the beta release, only a single text (with coverpage set) can be
             translated per invocation.`}
          </p>
          <p className="polyglotEngine-instruction">
            Enter the URL of the <strong>text to translate:</strong>
            <em> (all subpages will be included!)</em>
          </p>
          <input
            type="url"
            placeholder="URL"
            value={url}
            onChange={handleURLChange}
            className={urlErr ? 'inputError' : ''}
          />
          <p className="polyglotEngine-instruction">
            Enter the URL of the new <strong>parent directory</strong> for the translated text.
            <em> (e.g. https://socialsci.libretexts.org/Sandboxes/TranslatedTexts)</em>
          </p>
          <input
            type="url"
            placeholder="Target Path"
            value={targetPath}
            onChange={handleTargetChange}
            className={targetPathErr ? 'inputError' : ''}
          />
          <p className="polyglotEngine-instruction">
            Enter the desired <strong>language code</strong>.
            <em> A full list of supported codes can be found
              <a
                href="https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html"
                target="_blank"
                rel="noreferrer"
              >
                {' '}here.
              </a>
            </em>
          </p>
          <input
            type="text"
            placeholder="Target Language"
            value={language}
            onChange={handleLanguageChange}
            className={languageErr ? 'inputError' : ''}
          />
          <p className="polyglotEngine-instruction">
            Enter a <strong>comma-separated</strong> list of emails to notify upon completion.{' '}
            <em>
              As of the beta release, these must be @libretexts.org addresses. This is optional.
            </em>
          </p>
          <input
            type="text"
            placeholder="Email(s) to Notify"
            value={notify}
            onChange={handleNotifyChange}
            className={notifyErr ? 'inputError' : ''}
          />
        </div>
        <div>
          <p>Enter the provided Engine password.</p>
          <div className="polyglotEngine-passInput">
            <input
              type={passwordVis ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              className={passwordErr ? 'inputError' : ''}
            />
            <IconButton
              aria-label="Toggle Password Visibility"
              onClick={handlePasswordVisClick}
              onMouseDown={preventDefault}
            >
              {passwordVis ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </div>
          <Button
            onClick={handleSubmitClick}
            fullWidth
            variant="contained"
            color="primary"
            className="polyglotEngine-submitBtn"
          >
            Submit
          </Button>
          <div>
            {loading && (
              <div className="spinner">
                <div className="bounce1" />
                <div className="bounce2" />
                <div className="bounce3" />
              </div>
            )}
            {(!loading && output) && (
              <>
                <p><strong>STATUS:</strong> {output.status}</p>
                <p><strong>OUTPUT:</strong> {output.msg}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}