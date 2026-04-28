/**
 * JPS UTM Attribution Tracker
 * Version: 1.2.0
 *
 * Automatically captures UTM parameters and populates hidden form fields
 * for accurate marketing attribution tracking.
 *
 * Features:
 * - Cookie persistence (30 days)
 * - localStorage fallback
 * - Multi-page tracking
 * - Auto-populate hidden fields (standard name, data-utm, GHL data-q)
 * - GDPR-ready
 * - Error handling
 * - GoHighLevel data-q attribute support
 * - NEW v1.2: Iframe URL passthrough for embedded GHL forms (multi-tenant)
 */

(function() {
  'use strict';

  // Guard: Prevent double-initialization
  if (window.JPSUTMTracker && window.JPSUTMTracker.version) {
    console.log('[UTM Tracker] Already initialized v' + window.JPSUTMTracker.version + ', skipping duplicate');
    return;
  }

  const CONFIG = {
    version: '1.2.0',
    cookieMaxAge: 2592000, // 30 days in seconds
    cookiePath: '/',
    storagePrefix: 'jps_utm_',
    utmParams: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'],
    clickIds: ['fbclid', 'gclid'], // Facebook & Google click IDs for conversion tracking
    debug: false, // Set to true for console logging
    gdprCompliant: true, // Check for cookie consent before storing
    // NEW v1.2: GHL iframe hosts for URL passthrough (universal multi-tenant)
    ghlHosts: [
      'leadconnectorhq.com',     // Forms (catches api.leadconnectorhq.com via substring)
      'msgsndr.com',             // Funnels / sites
      'gohighlevel.com',         // Legacy + admin
      'forms.gohighlevel.com'    // Legacy form host
    ]
  };

  // NEW v1.2: Pull custom whitelabel host from <script data-iframe-host="..."> if present
  (function pullCustomHost() {
    try {
      const scripts = document.querySelectorAll('script');
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src || '';
        if (src.indexOf('utm-tracker') === -1 && src.indexOf('tracker.js') === -1) continue;
        const custom = scripts[i].getAttribute('data-iframe-host');
        if (custom && CONFIG.ghlHosts.indexOf(custom) === -1) {
          CONFIG.ghlHosts.push(custom);
        }
        break;
      }
    } catch (e) { /* swallow */ }
  })();

  // NEW v1.2: Detect parent vs iframe context
  const IS_IN_IFRAME = (function() {
    try { return window.self !== window.top; }
    catch (e) { return true; } // cross-origin top access throws → must be in iframe
  })();

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
   * Capture UTM parameters and click IDs from current URL
   */
  function captureUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const captured = {};
    let hasParams = false;

    // Capture UTM parameters
    CONFIG.utmParams.forEach(function(param) {
      const value = urlParams.get(param);
      if (value) {
        captured[param] = value;
        hasParams = true;
        setCookie(param, value);
        setLocalStorage(param, value);
      }
    });

    // Capture click IDs (fbclid, gclid)
    CONFIG.clickIds.forEach(function(param) {
      const value = urlParams.get(param);
      if (value) {
        captured[param] = value;
        hasParams = true;
        setCookie(param, value);
        setLocalStorage(param, value);
      }
    });

    if (hasParams) {
      log.info('Parameters captured', captured);
    } else {
      log.info('No tracking parameters found in URL');
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
   * Get all stored parameters (UTMs + click IDs)
   */
  function getAllStoredUTMs() {
    const stored = {};

    // Get UTM params
    CONFIG.utmParams.forEach(function(param) {
      const value = getStoredUTM(param);
      if (value) {
        stored[param] = value;
      }
    });

    // Get click IDs
    CONFIG.clickIds.forEach(function(param) {
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

  // ============================================================
  // NEW v1.2: IFRAME URL PASSTHROUGH (multi-tenant universal)
  // ============================================================

  /**
   * Check if a given URL points to a known GHL iframe host.
   */
  function isGhlIframe(src) {
    if (!src) return false;
    for (let i = 0; i < CONFIG.ghlHosts.length; i++) {
      if (src.indexOf(CONFIG.ghlHosts[i]) !== -1) return true;
    }
    return false;
  }

  /**
   * Append UTMs + click IDs to a single iframe's `src` (idempotent).
   * Solves cross-origin: when GHL form is embedded as an iframe on a
   * client website, the iframe cannot read parent URL UTMs. This patches
   * the iframe URL with query params BEFORE the iframe loads, so the
   * GHL page receives the data and can capture it via this same script
   * running on the GHL side.
   */
  function patchIframeUrl(iframe) {
    const utmData = getAllStoredUTMs();
    if (Object.keys(utmData).length === 0) return false;

    const src = iframe.src || iframe.getAttribute('data-src') || '';
    if (!src || !isGhlIframe(src)) return false;
    if (src.indexOf('jps_patched=1') !== -1) return false; // already done

    try {
      const url = new URL(src);
      let added = 0;
      Object.keys(utmData).forEach(function(key) {
        if (!url.searchParams.has(key)) {
          url.searchParams.set(key, decodeURIComponent(utmData[key]));
          added++;
        }
      });
      url.searchParams.set('jps_patched', '1');
      iframe.src = url.toString();
      log.info('Patched iframe with ' + added + ' params', iframe.src);
      return true;
    } catch (e) {
      log.error('Iframe patch failed', e);
      return false;
    }
  }

  /**
   * Patch all GHL iframes on the page (parent-context only).
   */
  function patchAllIframes() {
    if (IS_IN_IFRAME) return; // Only patch from parent context
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(function(iframe) { patchIframeUrl(iframe); });
  }

  /**
   * Initialize tracker
   */
  function init() {
    log.info('UTM Tracker v' + CONFIG.version + ' initializing...', {
      context: IS_IN_IFRAME ? 'iframe' : 'parent',
      ghlHosts: CONFIG.ghlHosts
    });

    // Step 1: Capture UTM params from URL (if present)
    captureUTMParams();

    // Step 2: Wait for DOM to be ready, then populate forms + patch iframes
    function onReady() {
      populateFormFields();
      if (!IS_IN_IFRAME) patchAllIframes();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }

    // Step 3: Re-populate on dynamic form loads (SPA support)
    // Watch for new forms / iframes being added to the DOM
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType !== 1) return; // Element nodes only

              // New <form> detected → re-populate fields
              if (node.tagName === 'FORM' || node.querySelector('form')) {
                log.info('New form detected, populating fields');
                setTimeout(populateFormFields, 100);
              }

              // NEW v1.2: New <iframe> detected → patch it (parent context only)
              if (!IS_IN_IFRAME) {
                if (node.tagName === 'IFRAME') {
                  patchIframeUrl(node);
                } else if (node.querySelector && node.querySelector('iframe')) {
                  setTimeout(patchAllIframes, 50);
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
    // NEW v1.2:
    patchIframes: patchAllIframes,
    isInIframe: function() { return IS_IN_IFRAME; },
    ghlHosts: function() { return CONFIG.ghlHosts.slice(); },
    debug: function(enable) {
      CONFIG.debug = enable;
    }
  };

})();
