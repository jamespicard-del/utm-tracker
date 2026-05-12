/**
 * JPS UTM Attribution Tracker — Version 1.3.0
 * Captures UTM/click-ids → cookies+localStorage → form auto-fill + iframe passthrough + behavioral beacons.
 *
 * v1.2 features: cookie persistence 30d, localStorage fallback, multi-page tracking, hidden-field auto-fill
 * (standard name + data-utm + GHL data-q), GDPR consent gate, iframe URL passthrough for embedded GHL forms.
 *
 * NEW v1.3: persistent UID cookie (UUID v4 30d) + localStorage fallback; three behavioral beacons (pageview,
 * form_view, form_start) via navigator.sendBeacon; data-account script-tag attribute → account_slug; iframe →
 * parent postMessage routing for beacons (parent validates origin vs CONFIG.ghlHosts).
 */

(function() {
  'use strict';

  // Guard: Prevent double-initialization
  if (window.JPSUTMTracker && window.JPSUTMTracker.version) {
    console.log('[UTM Tracker] Already initialized v' + window.JPSUTMTracker.version + ', skipping duplicate');
    return;
  }

  const CONFIG = {
    version: '1.3.0',
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
    ],
    // NEW v1.3: UID + beacon configuration
    uidCookieName: 'jps_uid',
    uidStorageKey: 'uid',                 // suffix; full key = storagePrefix + uidStorageKey = 'jps_utm_uid' (D-23)
    beaconEndpoint: 'https://track.jpmetrix.com/api/beacon',
    beaconEvents: {
      pageview: 'pageview',
      formView: 'form_view',
      formStart: 'form_start'
    },
    formViewThreshold: 0.5,               // IntersectionObserver — D-09
    iframeMessageType: 'jps-beacon'       // postMessage envelope type — D-14
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

  // NEW v1.3: Module-scoped state. FORM_OBSERVED = wired forms; FORM_VIEW_FIRED / FORM_START_FIRED = form_ids that already emitted.
  let ACCOUNT_SLUG = null;
  let UID = null;
  const FORM_OBSERVED = new WeakSet();
  const FORM_VIEW_FIRED = new Set();
  const FORM_START_FIRED = new Set();

  // NEW v1.3: Read data-account from own <script> tag (D-01, TRACK-07)
  (function readDataAccount() {
    try {
      let scriptEl = document.currentScript;
      if (scriptEl) {
        const acc = scriptEl.getAttribute('data-account');
        if (acc) { ACCOUNT_SLUG = acc; return; }
      }
      const scripts = document.querySelectorAll('script');
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src || '';
        if (src.indexOf('utm-tracker') === -1 && src.indexOf('tracker.js') === -1) continue;
        const acc = scripts[i].getAttribute('data-account');
        if (acc) { ACCOUNT_SLUG = acc; return; }
      }
    } catch (e) { /* swallow */ }
  })();

  // NEW v1.2: Detect parent vs iframe context
  const IS_IN_IFRAME = (function() {
    try { return window.self !== window.top; } catch (e) { return true; }
  })();

  // Logger utility
  const log = {
    info: function(msg, data) { if (CONFIG.debug) console.log('[UTM Tracker]', msg, data || ''); },
    error: function(msg, error) { if (CONFIG.debug) console.error('[UTM Tracker ERROR]', msg, error); },
    beacon: function(eventType, payloadOrError) { if (CONFIG.debug) console.log('[UTM Tracker BEACON]', eventType, payloadOrError || ''); }
  };

  // Check if cookies are accepted (GDPR compliance). Override to integrate with your CMP.
  function cookiesAccepted() {
    if (!CONFIG.gdprCompliant) return true;
    const consentCookie = getCookie('cookie_consent') || getCookie('cookieConsent') || getCookie('cookies_accepted');
    return consentCookie !== 'false';
  }

  // Get cookie value by name
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Set cookie with name and value
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

  // Get value from localStorage
  function getLocalStorage(key) {
    try {
      return localStorage.getItem(CONFIG.storagePrefix + key);
    } catch (e) {
      log.error('Failed to read localStorage', e);
      return null;
    }
  }

  // Set value in localStorage
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

  // NEW v1.3: Generate UUID v4 — crypto.randomUUID() preferred, crypto.getRandomValues fallback (D-21).
  function generateUID() {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      // Fallback manual UUID v4 (RFC 4122) — uses crypto.getRandomValues for entropy
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const b = new Uint8Array(16);
        crypto.getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40; // version 4
        b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
        const h = [];
        for (let i = 0; i < 16; i++) h.push(b[i].toString(16).padStart(2, '0'));
        return h[0]+h[1]+h[2]+h[3]+'-'+h[4]+h[5]+'-'+h[6]+h[7]+'-'+h[8]+h[9]+'-'+h[10]+h[11]+h[12]+h[13]+h[14]+h[15];
      }
    } catch (e) { log.error('UID generation failed', e); }
    return 'fid_fallback_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  // NEW v1.3: setCookie variant with Secure attribute when on https (D-22).
  function setCookieSecure(name, value) {
    if (!cookiesAccepted()) { log.info('Cookies not accepted, skipping cookie storage'); return false; }
    try {
      const secure = (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') ? '; Secure' : '';
      document.cookie = name + '=' + encodeURIComponent(value) + '; max-age=' + CONFIG.cookieMaxAge + '; path=' + CONFIG.cookiePath + '; SameSite=Lax' + secure;
      log.info('Cookie set (secure): ' + name + '=' + value);
      return true;
    } catch (e) { log.error('Failed to set secure cookie', e); return false; }
  }

  // NEW v1.3: Read UID from cookie → localStorage → generate fresh. Gated by cookiesAccepted() (D-18, D-22, D-23, D-24).
  function getOrCreateUID() {
    if (!cookiesAccepted()) { log.info('UID: consent denied, skipping'); return null; }
    try {
      let uid = getCookie(CONFIG.uidCookieName);
      if (uid) { log.info('UID: loaded from cookie', uid); return uid; }
      uid = getLocalStorage(CONFIG.uidStorageKey);
      if (uid) { log.info('UID: loaded from localStorage, re-setting cookie', uid); setCookieSecure(CONFIG.uidCookieName, uid); return uid; }
      uid = generateUID();
      log.info('UID: generated fresh', uid);
      setCookieSecure(CONFIG.uidCookieName, uid);
      setLocalStorage(CONFIG.uidStorageKey, uid);
      return uid;
    } catch (e) { log.error('getOrCreateUID failed', e); return null; }
  }

  // NEW v1.3: Build the standard beacon payload envelope (D-10).
  function buildBeaconPayload(eventType, extras) {
    const stored = getAllStoredUTMs();
    const utm = {};
    const clickIds = {};
    CONFIG.utmParams.forEach(function(k) {
      if (stored[k]) utm[k.replace(/^utm_/, '')] = decodeURIComponent(stored[k]);
    });
    CONFIG.clickIds.forEach(function(k) {
      if (stored[k]) clickIds[k] = decodeURIComponent(stored[k]);
    });
    const payload = {
      event: eventType,
      uid: UID,
      account_slug: ACCOUNT_SLUG,
      url: (typeof window !== 'undefined' && window.location) ? window.location.href : '',
      referrer: (typeof document !== 'undefined') ? (document.referrer || '') : '',
      utm: utm,
      click_ids: clickIds,
      form_id: (extras && extras.form_id) ? extras.form_id : null,
      ts_client: new Date().toISOString(),
      v: CONFIG.version
    };
    return payload;
  }

  // NEW v1.3: Dispatch a beacon. Iframe → postMessage to parent. Parent → sendBeacon + fetch keepalive fallback. Gated by cookiesAccepted() (D-18, D-08).
  function sendBeaconEvent(eventType, extras) {
    try {
      if (!cookiesAccepted()) { log.beacon(eventType, 'skipped: consent denied'); return false; }
      if (!UID) { log.beacon(eventType, 'skipped: no UID'); return false; }
      const payload = buildBeaconPayload(eventType, extras || {});
      // Iframe context → relay to parent (D-14, D-15, D-16)
      if (IS_IN_IFRAME) {
        try {
          window.parent.postMessage({ type: CONFIG.iframeMessageType, payload: payload }, '*');
          log.beacon(eventType, 'relayed via postMessage to parent');
          return true;
        } catch (e) { log.error('postMessage to parent failed', e); return false; }
      }
      // Parent context → direct dispatch
      return dispatchBeacon(payload);
    } catch (e) { log.error('sendBeaconEvent failed', e); return false; }
  }

  // NEW v1.3: Low-level beacon dispatch (parent only). sendBeacon → fetch keepalive fallback.
  function dispatchBeacon(payload) {
    try {
      const body = JSON.stringify(payload);
      const blob = new Blob([body], { type: 'application/json' });
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const ok = navigator.sendBeacon(CONFIG.beaconEndpoint, blob);
        if (ok) { log.beacon(payload.event, 'sent via sendBeacon'); return true; }
        log.beacon(payload.event, 'sendBeacon returned false, attempting fetch fallback');
      }
      if (typeof fetch === 'function') {
        fetch(CONFIG.beaconEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, mode: 'no-cors' })
          .then(function() { log.beacon(payload.event, 'sent via fetch keepalive'); })
          .catch(function(err) { log.error('fetch beacon failed', err); });
        return true;
      }
      log.error('No beacon transport available', null);
      return false;
    } catch (e) { log.error('dispatchBeacon threw', e); return false; }
  }

  // NEW v1.3: Parent-window listener for iframe-relayed beacons. Validates origin vs CONFIG.ghlHosts, enriches url+referrer (D-15, D-16).
  function installParentMessageListener() {
    if (IS_IN_IFRAME) return;
    try {
      window.addEventListener('message', function(ev) {
        try {
          const data = ev && ev.data;
          if (!data || typeof data !== 'object') return;
          if (data.type !== CONFIG.iframeMessageType) return;
          if (!data.payload || typeof data.payload !== 'object') return;
          const origin = ev.origin || '';
          let trusted = false;
          for (let i = 0; i < CONFIG.ghlHosts.length; i++) {
            if (origin.indexOf(CONFIG.ghlHosts[i]) !== -1) { trusted = true; break; }
          }
          if (!trusted) { log.beacon('iframe-relay', 'dropped: untrusted origin ' + origin); return; }
          // Enrich with parent's own URL + referrer (D-16)
          const enriched = data.payload;
          enriched.url = (typeof window !== 'undefined' && window.location) ? window.location.href : enriched.url;
          enriched.referrer = (typeof document !== 'undefined') ? (document.referrer || enriched.referrer) : enriched.referrer;
          dispatchBeacon(enriched);
        } catch (innerErr) { log.error('parent message handler inner error', innerErr); }
      }, false);
      log.info('Parent message listener installed for iframe beacon relay');
    } catch (e) { log.error('installParentMessageListener failed', e); }
  }

  // Capture UTM parameters and click IDs from current URL
  function captureUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const captured = {};
    let hasParams = false;
    CONFIG.utmParams.concat(CONFIG.clickIds).forEach(function(param) {
      const value = urlParams.get(param);
      if (value) {
        captured[param] = value;
        hasParams = true;
        setCookie(param, value);
        setLocalStorage(param, value);
      }
    });
    log.info(hasParams ? 'Parameters captured' : 'No tracking parameters found in URL', captured);
    return captured;
  }

  // Get stored UTM value (cookie first, then localStorage)
  function getStoredUTM(param) {
    let value = getCookie(param);
    if (!value) value = getLocalStorage(param);
    return value;
  }

  // Get all stored parameters (UTMs + click IDs)
  function getAllStoredUTMs() {
    const stored = {};
    CONFIG.utmParams.forEach(function(param) {
      const value = getStoredUTM(param);
      if (value) stored[param] = value;
    });
    CONFIG.clickIds.forEach(function(param) {
      const value = getStoredUTM(param);
      if (value) stored[param] = value;
    });
    return stored;
  }

  // Populate hidden form fields with UTM data
  function populateFormFields() {
    const utmData = getAllStoredUTMs();
    if (Object.keys(utmData).length === 0) { log.info('No UTM data to populate'); return; }
    log.info('Populating form fields with UTM data', utmData);
    // Standard hidden/text input matching by name
    document.querySelectorAll('input[type="hidden"], input[type="text"]').forEach(function(input) {
      const fieldName = input.name || input.getAttribute('name') || input.id;
      if (fieldName && utmData[fieldName] && (!input.value || input.value === '')) {
        input.value = decodeURIComponent(utmData[fieldName]);
        log.info(`Populated field: ${fieldName} = ${input.value}`);
      }
    });
    // data-utm attribute pattern
    document.querySelectorAll('[data-utm]').forEach(function(field) {
      const utmParam = field.getAttribute('data-utm');
      if (utmParam && utmData[utmParam] && (!field.value || field.value === '')) {
        field.value = decodeURIComponent(utmData[utmParam]);
        log.info(`Populated data-utm field: ${utmParam} = ${field.value}`);
      }
    });
    // GoHighLevel data-q attribute pattern
    document.querySelectorAll('[data-q]').forEach(function(field) {
      const fieldKey = field.getAttribute('data-q');
      if (fieldKey && utmData[fieldKey] && (!field.value || field.value === '')) {
        field.value = decodeURIComponent(utmData[fieldKey]);
        log.info(`Populated GHL field (data-q): ${fieldKey} = ${field.value}`);
      }
    });
  }

  // NEW v1.2: IFRAME URL PASSTHROUGH (multi-tenant universal)
  // Check if a given URL points to a known GHL iframe host.
  function isGhlIframe(src) {
    if (!src) return false;
    for (let i = 0; i < CONFIG.ghlHosts.length; i++) {
      if (src.indexOf(CONFIG.ghlHosts[i]) !== -1) return true;
    }
    return false;
  }

  // Append UTMs + click IDs to a single iframe's src (idempotent). Solves cross-origin: GHL form embedded on client website cannot read parent URL UTMs.
  function patchIframeUrl(iframe) {
    const utmData = getAllStoredUTMs();
    if (Object.keys(utmData).length === 0) return false;
    const src = iframe.src || iframe.getAttribute('data-src') || '';
    if (!src || !isGhlIframe(src)) return false;
    if (src.indexOf('jps_patched=1') !== -1) return false;
    try {
      const url = new URL(src);
      let added = 0;
      Object.keys(utmData).forEach(function(key) {
        if (!url.searchParams.has(key)) { url.searchParams.set(key, decodeURIComponent(utmData[key])); added++; }
      });
      url.searchParams.set('jps_patched', '1');
      iframe.src = url.toString();
      log.info('Patched iframe with ' + added + ' params', iframe.src);
      return true;
    } catch (e) { log.error('Iframe patch failed', e); return false; }
  }

  // Patch all GHL iframes on the page (parent-context only).
  function patchAllIframes() {
    if (IS_IN_IFRAME) return;
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(function(iframe) { patchIframeUrl(iframe); });
  }

  // Initialize tracker
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
    },
    // NEW v1.3 additions (no forward refs)
    get uid() { return UID; },
    get account() { return ACCOUNT_SLUG; }
    // NOTE: flushBeacon is attached below AFTER window.JPSUTMTracker is assigned.
  };

  // NEW v1.3: Expose flushBeacon debug helper (after sendBeaconEvent is defined AND
  // window.JPSUTMTracker namespace is assigned — no forward ref, no race).
  if (window.JPSUTMTracker) {
    window.JPSUTMTracker.flushBeacon = function(eventType, extras) {
      return sendBeaconEvent(eventType, extras || {});
    };
  }

})();
