/**
 * JPS UTM Attribution Tracker
 * Version: 1.0.1
 *
 * Automatically captures UTM parameters and populates hidden form fields
 * for accurate marketing attribution tracking.
 *
 * Features:
 * - Cookie persistence (30 days)
 * - localStorage fallback
 * - Multi-page tracking
 * - Auto-populate hidden fields
 * - GDPR-ready
 * - Error handling
 * - GoHighLevel data-q attribute support
 */

(function() {
  'use strict';

  const CONFIG = {
    version: '1.0.1',
    cookieMaxAge: 2592000, // 30 days in seconds
    cookiePath: '/',
    storagePrefix: 'jps_utm_',
    utmParams: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'],
    debug: false, // Set to true for console logging
    gdprCompliant: true // Check for cookie consent before storing
  };

  /**
   * Logger utility
   */
  const log = {
    info: function(msg, data) {
      if (CONFIG.debug) console.log('[UTM Tracker]', msg, data || '');
    },
    error: function(msg, error) {
      if (CONFIG.debug) console.error('[UTM Tracker ERROR]', msg, error);
    }
  };

  /**
   * Check if cookies are accepted (GDPR compliance)
   * Override this function to integrate with your cookie consent solution
   */
  function cookiesAccepted() {
    if (!CONFIG.gdprCompliant) return true;

    // Check common cookie consent patterns
    // Customize this based on your consent management platform
    const consentCookie = getCookie('cookie_consent') ||
                         getCookie('cookieConsent') ||
                         getCookie('cookies_accepted');

    // If no consent system detected, assume consent (adjust as needed)
    return consentCookie !== 'false';
  }

  /**
   * Get cookie value by name
   */
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Set cookie with name and value
   */
  function setCookie(name, value) {
    if (!cookiesAccepted()) {
      log.info('Cookies not accepted, skipping cookie storage');
      return false;
    }

    try {
      document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${CONFIG.cookieMaxAge}; path=${CONFIG.cookiePath}; SameSite=Lax`;
      log.info(`Cookie set: ${name}=${value}`);
      return true;
    } catch (e) {
      log.error('Failed to set cookie', e);
      return false;
    }
  }

  /**
   * Get value from localStorage
   */
  function getLocalStorage(key) {
    try {
      return localStorage.getItem(CONFIG.storagePrefix + key);
    } catch (e) {
      log.error('Failed to read localStorage', e);
      return null;
    }
  }

  /**
   * Set value in localStorage
   */
  function setLocalStorage(key, value) {
    try {
      localStorage.setItem(CONFIG.storagePrefix + key, value);
      log.info(`localStorage set: ${key}=${value}`);
      return true;
    } catch (e) {
      log.error('Failed to set localStorage', e);
      return false;
    }
  }

  /**
   * Capture UTM parameters from current URL
   */
  function captureUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const captured = {};
    let hasUTM = false;

    CONFIG.utmParams.forEach(function(param) {
      const value = urlParams.get(param);
      if (value) {
        captured[param] = value;
        hasUTM = true;

        // Store in both cookie and localStorage (redundancy)
        setCookie(param, value);
        setLocalStorage(param, value);
      }
    });

    if (hasUTM) {
      log.info('UTM parameters captured', captured);
    } else {
      log.info('No UTM parameters found in URL');
    }

    return captured;
  }

  /**
   * Get stored UTM value (check cookie first, then localStorage)
   */
  function getStoredUTM(param) {
    let value = getCookie(param);
    if (!value) {
      value = getLocalStorage(param);
    }
    return value;
  }

  /**
   * Get all stored UTM parameters
   */
  function getAllStoredUTMs() {
    const stored = {};

    CONFIG.utmParams.forEach(function(param) {
      const value = getStoredUTM(param);
      if (value) {
        stored[param] = value;
      }
    });

    return stored;
  }

  /**
   * Populate hidden form fields with UTM data
   */
  function populateFormFields() {
    const utmData = getAllStoredUTMs();

    if (Object.keys(utmData).length === 0) {
      log.info('No UTM data to populate');
      return;
    }

    log.info('Populating form fields with UTM data', utmData);

    // Find all hidden input fields that match UTM parameter names
    const inputs = document.querySelectorAll('input[type="hidden"], input[type="text"]');

    inputs.forEach(function(input) {
      const fieldName = input.name || input.getAttribute('name') || input.id;

      if (fieldName && utmData[fieldName]) {
        // Only populate if field is empty
        if (!input.value || input.value === '') {
          input.value = decodeURIComponent(utmData[fieldName]);
          log.info(`Populated field: ${fieldName} = ${input.value}`);
        }
      }
    });

    // Also check for fields with data-utm attributes (alternative pattern)
    const utmFields = document.querySelectorAll('[data-utm]');
    utmFields.forEach(function(field) {
      const utmParam = field.getAttribute('data-utm');
      if (utmParam && utmData[utmParam]) {
        if (!field.value || field.value === '') {
          field.value = decodeURIComponent(utmData[utmParam]);
          log.info(`Populated data-utm field: ${utmParam} = ${field.value}`);
        }
      }
    });

    // GoHighLevel compatibility: check for data-q attributes
    const ghlFields = document.querySelectorAll('[data-q]');
    ghlFields.forEach(function(field) {
      const fieldKey = field.getAttribute('data-q');
      if (fieldKey && utmData[fieldKey]) {
        if (!field.value || field.value === '') {
          field.value = decodeURIComponent(utmData[fieldKey]);
          log.info(`Populated GHL field (data-q): ${fieldKey} = ${field.value}`);
        }
      }
    });
  }

  /**
   * Initialize tracker
   */
  function init() {
    log.info(`UTM Tracker v${CONFIG.version} initializing...`);

    // Step 1: Capture UTM params from URL (if present)
    captureUTMParams();

    // Step 2: Wait for DOM to be ready, then populate forms
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', populateFormFields);
    } else {
      // DOM already loaded
      populateFormFields();
    }

    // Step 3: Re-populate on dynamic form loads (SPA support)
    // Watch for new forms being added to the DOM
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
            // Check if any added nodes contain forms
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
                if (node.tagName === 'FORM' || node.querySelector('form')) {
                  log.info('New form detected, populating fields');
                  setTimeout(populateFormFields, 100); // Small delay for form initialization
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    log.info('UTM Tracker initialized successfully');
  }

  // Auto-initialize when script loads
  init();

  // Expose public API (optional, for advanced usage)
  window.JPSUTMTracker = {
    version: CONFIG.version,
    getUTMData: getAllStoredUTMs,
    refresh: populateFormFields,
    debug: function(enable) {
      CONFIG.debug = enable;
    }
  };

})();
