/* JPS UTM Attribution Tracker v1.3.0 — UTM/click-id capture (cookie+localStorage) → form auto-fill + iframe passthrough + behavioral beacons (pageview/form_view/form_start) via navigator.sendBeacon. UID cookie (UUID v4, 30d). data-account script attr → account_slug. Iframe → parent postMessage routing (origin validated vs CONFIG.ghlHosts). GDPR consent gated. */

(function() {
  'use strict';

  // Guard: double-init
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
    // v1.2: GHL iframe hosts
    ghlHosts: [
      'leadconnectorhq.com',     // Forms (catches api.leadconnectorhq.com via substring)
      'msgsndr.com',             // Funnels / sites
      'gohighlevel.com',         // Legacy + admin
      'forms.gohighlevel.com'    // Legacy form host
    ],
    // v1.3: UID + beacon
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

  // v1.2: pull data-iframe-host
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

  // v1.3: module state
  let ACCOUNT_SLUG = null;
  let UID = null;
  const FORM_OBSERVED = new WeakSet();
  const FORM_VIEW_FIRED = new Set();
  const FORM_START_FIRED = new Set();

  // v1.3: data-account (D-01,TRACK-07)
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

  // v1.2: iframe detect
  const IS_IN_IFRAME = (function() {
    try { return window.self !== window.top; } catch (e) { return true; }
  })();

  // Logger
  const log = {
    info: function(m, d) { if (CONFIG.debug) console.log('[UTM]', m, d || ''); },
    error: function(m, e) { if (CONFIG.debug) console.error('[UTM ERR]', m, e); },
    beacon: function(t, p) { if (CONFIG.debug) console.log('[UTM BCN]', t, p || ''); }
  };

  // GDPR consent gate
  function cookiesAccepted() {
    if (!CONFIG.gdprCompliant) return true;
    const consentCookie = getCookie('cookie_consent') || getCookie('cookieConsent') || getCookie('cookies_accepted');
    return consentCookie !== 'false';
  }

  // getCookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // setCookie
  function setCookie(name, value) {
    if (!cookiesAccepted()) {
      log.info('no consent');
      return false;
    }
    try {
      document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${CONFIG.cookieMaxAge}; path=${CONFIG.cookiePath}; SameSite=Lax`;
      log.info('cookie set', name);
      return true;
    } catch (e) {
      log.error('setCookie', e);
      return false;
    }
  }

  // getLS
  function getLocalStorage(key) {
    try {
      return localStorage.getItem(CONFIG.storagePrefix + key);
    } catch (e) {
      log.error('getLS', e);
      return null;
    }
  }

  // setLS
  function setLocalStorage(key, value) {
    try {
      localStorage.setItem(CONFIG.storagePrefix + key, value);
      log.info('ls set', key);
      return true;
    } catch (e) {
      log.error('setLS', e);
      return false;
    }
  }

  // v1.3: UUID v4 (D-21)
  function generateUID() {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const b = new Uint8Array(16);
        crypto.getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        const h = [];
        for (let i = 0; i < 16; i++) h.push(b[i].toString(16).padStart(2, '0'));
        return h[0]+h[1]+h[2]+h[3]+'-'+h[4]+h[5]+'-'+h[6]+h[7]+'-'+h[8]+h[9]+'-'+h[10]+h[11]+h[12]+h[13]+h[14]+h[15];
      }
    } catch (e) { log.error('UID gen', e); }
    return 'fid_fallback_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  // v1.3: setCookieSecure (D-22)
  function setCookieSecure(name, value) {
    if (!cookiesAccepted()) { log.info('no consent'); return false; }
    try {
      const secure = (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') ? '; Secure' : '';
      document.cookie = name + '=' + encodeURIComponent(value) + '; max-age=' + CONFIG.cookieMaxAge + '; path=' + CONFIG.cookiePath + '; SameSite=Lax' + secure;
      log.info('cookie sec', name);
      return true;
    } catch (e) { log.error('setCookieSec', e); return false; }
  }

  // v1.3: getOrCreateUID (D-18,22,23,24)
  function getOrCreateUID() {
    if (!cookiesAccepted()) { log.info('UID denied'); return null; }
    try {
      let uid = getCookie(CONFIG.uidCookieName);
      if (uid) { log.info('UID cookie', uid); return uid; }
      uid = getLocalStorage(CONFIG.uidStorageKey);
      if (uid) { log.info('UID LS', uid); setCookieSecure(CONFIG.uidCookieName, uid); return uid; }
      uid = generateUID();
      log.info('UID new', uid);
      setCookieSecure(CONFIG.uidCookieName, uid);
      setLocalStorage(CONFIG.uidStorageKey, uid);
      return uid;
    } catch (e) { log.error('getOrCreateUID', e); return null; }
  }

  // v1.3: buildBeaconPayload (D-10)
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

  // v1.3: sendBeaconEvent (D-18,D-08)
  function sendBeaconEvent(eventType, extras) {
    try {
      if (!cookiesAccepted()) { log.beacon(eventType, 'denied'); return false; }
      if (!UID) { log.beacon(eventType, 'no UID'); return false; }
      const payload = buildBeaconPayload(eventType, extras || {});
      // iframe → parent
      if (IS_IN_IFRAME) {
        try {
          window.parent.postMessage({ type: CONFIG.iframeMessageType, payload: payload }, '*');
          log.beacon(eventType, 'relayed');
          return true;
        } catch (e) { log.error('postMsg', e); return false; }
      }
      // parent
      return dispatchBeacon(payload);
    } catch (e) { log.error('sendBeacon', e); return false; }
  }

  // v1.3: dispatchBeacon
  function dispatchBeacon(payload) {
    try {
      const body = JSON.stringify(payload);
      const blob = new Blob([body], { type: 'application/json' });
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const ok = navigator.sendBeacon(CONFIG.beaconEndpoint, blob);
        if (ok) { log.beacon(payload.event, 'sent'); return true; }
        log.beacon(payload.event, 'fb fetch');
      }
      if (typeof fetch === 'function') {
        fetch(CONFIG.beaconEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, mode: 'no-cors' })
          .then(function() { log.beacon(payload.event, 'fetch sent'); })
          .catch(function(err) { log.error('fetch', err); });
        return true;
      }
      log.error('no transport', null);
      return false;
    } catch (e) { log.error('dispatch', e); return false; }
  }

  // v1.3: parent listener (D-15,D-16)
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
          if (!trusted) { log.beacon('relay', 'untrusted ' + origin); return; }
          // enrich url+ref (D-16)
          const enriched = data.payload;
          enriched.url = (typeof window !== 'undefined' && window.location) ? window.location.href : enriched.url;
          enriched.referrer = (typeof document !== 'undefined') ? (document.referrer || enriched.referrer) : enriched.referrer;
          dispatchBeacon(enriched);
        } catch (innerErr) { log.error('msg handler', innerErr); }
      }, false);
      log.info('parent listener up');
    } catch (e) { log.error('parent listener', e); }
  }

  // captureUTMParams
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
    log.info(hasParams ? 'params' : 'no params', captured);
    return captured;
  }

  // getStoredUTM
  function getStoredUTM(param) {
    let value = getCookie(param);
    if (!value) value = getLocalStorage(param);
    return value;
  }

  // getAllStoredUTMs
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

  // populateFormFields
  function populateFormFields() {
    const utmData = getAllStoredUTMs();
    if (Object.keys(utmData).length === 0) { log.info('no UTM'); return; }
    log.info('populate', utmData);
    // by name
    document.querySelectorAll('input[type="hidden"], input[type="text"]').forEach(function(input) {
      const fieldName = input.name || input.getAttribute('name') || input.id;
      if (fieldName && utmData[fieldName] && (!input.value || input.value === '')) {
        input.value = decodeURIComponent(utmData[fieldName]);
        log.info('fld', fieldName);
      }
    });
    // data-utm
    document.querySelectorAll('[data-utm]').forEach(function(field) {
      const utmParam = field.getAttribute('data-utm');
      if (utmParam && utmData[utmParam] && (!field.value || field.value === '')) {
        field.value = decodeURIComponent(utmData[utmParam]);
        log.info('dutm', utmParam);
      }
    });
    // data-q
    document.querySelectorAll('[data-q]').forEach(function(field) {
      const fieldKey = field.getAttribute('data-q');
      if (fieldKey && utmData[fieldKey] && (!field.value || field.value === '')) {
        field.value = decodeURIComponent(utmData[fieldKey]);
        log.info('dq', fieldKey);
      }
    });
  }

  // v1.2: IFRAME URL PASSTHROUGH
  // isGhlIframe
  function isGhlIframe(src) {
    if (!src) return false;
    for (let i = 0; i < CONFIG.ghlHosts.length; i++) {
      if (src.indexOf(CONFIG.ghlHosts[i]) !== -1) return true;
    }
    return false;
  }

  // patchIframeUrl
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
      log.info('iframe patched', added);
      return true;
    } catch (e) { log.error('iframePatch', e); return false; }
  }

  // patchAllIframes
  function patchAllIframes() {
    if (IS_IN_IFRAME) return;
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(function(iframe) { patchIframeUrl(iframe); });
  }

  // v1.3: computeFormId (D-12,D-13)
  const formIdCache = new WeakMap();
  async function computeFormId(formEl) {
    try {
      if (!formEl || formEl.tagName !== 'FORM') return null;
      const explicitId = formEl.getAttribute('id');
      if (explicitId && explicitId.length > 0) return explicitId;
      const cached = formIdCache.get(formEl);
      if (cached) return cached;
      const inputs = Array.from(formEl.querySelectorAll('input[name], textarea[name], select[name]'))
        .map(function(i) { return i.getAttribute('name'); }).filter(function(n) { return !!n; });
      if (inputs.length === 0) return null;
      inputs.sort();
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(inputs.join(',')));
      const hex = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
      const formId = 'fid_' + hex.slice(0, 8);
      formIdCache.set(formEl, formId);
      return formId;
    } catch (e) { log.error('formId', e); return null; }
  }

  // v1.3: attachFormObservers (D-09)
  function attachFormObservers(formEl) {
    try {
      if (!formEl || formEl.tagName !== 'FORM') return;
      if (FORM_OBSERVED.has(formEl)) return;
      FORM_OBSERVED.add(formEl);
      if (typeof IntersectionObserver !== 'undefined') {
        try {
          const io = new IntersectionObserver(function(entries) {
            entries.forEach(async function(entry) {
              if (!entry.isIntersecting || entry.intersectionRatio < CONFIG.formViewThreshold) return;
              const formId = await computeFormId(formEl);
              if (!formId) { io.unobserve(formEl); return; }
              if (!FORM_VIEW_FIRED.has(formId)) {
                FORM_VIEW_FIRED.add(formId);
                sendBeaconEvent(CONFIG.beaconEvents.formView, { form_id: formId });
                io.unobserve(formEl);
              }
            });
          }, { threshold: CONFIG.formViewThreshold });
          io.observe(formEl);
        } catch (e) { log.error('IO attach', e); }
      } else { log.info('no IO'); }
      const onFocusIn = async function() {
        try {
          const formId = await computeFormId(formEl);
          if (!formId) return;
          if (!FORM_START_FIRED.has(formId)) {
            FORM_START_FIRED.add(formId);
            sendBeaconEvent(CONFIG.beaconEvents.formStart, { form_id: formId });
            formEl.removeEventListener('focusin', onFocusIn);
          }
        } catch (e) { log.error('focusin', e); }
      };
      formEl.addEventListener('focusin', onFocusIn);
      log.info('obs attached');
    } catch (e) { log.error('attach', e); }
  }

  // v1.3: attachAllFormObservers
  function attachAllFormObservers() {
    try { document.querySelectorAll('form').forEach(function(f) { attachFormObservers(f); }); }
    catch (e) { log.error('attachAll', e); }
  }

  // init
  function init() {
    log.info('init', { ctx: IS_IN_IFRAME ? 'i' : 'p', acc: ACCOUNT_SLUG });
    captureUTMParams();                          // Step 1: v1.2 — UTM/click-id capture
    UID = getOrCreateUID();                      // Step 2: v1.3 — UID cookie/localStorage/generate
    installParentMessageListener();              // Step 3: v1.3 — parent listener for iframe-relayed beacons
    sendBeaconEvent(CONFIG.beaconEvents.pageview, {}); // Step 4: v1.3 — fire pageview beacon
    function onReady() {                         // Step 5: DOM ready → populate + patch + attach observers
      populateFormFields();
      if (!IS_IN_IFRAME) patchAllIframes();
      attachAllFormObservers();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
    else onReady();
    // MutationObserver SPA
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (!mutation.addedNodes.length) return;
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'FORM') {
              log.info('form root');
              setTimeout(populateFormFields, 100);
              attachFormObservers(node);
            } else if (node.querySelector && node.querySelector('form')) {
              log.info('form nested');
              setTimeout(populateFormFields, 100);
              node.querySelectorAll('form').forEach(function(f) { attachFormObservers(f); });
            }
            if (!IS_IN_IFRAME) {
              if (node.tagName === 'IFRAME') patchIframeUrl(node);
              else if (node.querySelector && node.querySelector('iframe')) setTimeout(patchAllIframes, 50);
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    log.info('init ok', { uid: UID, account_slug: ACCOUNT_SLUG });
  }

  // auto-init
  init();

  // public API
  window.JPSUTMTracker = {
    version: CONFIG.version,
    getUTMData: getAllStoredUTMs,
    refresh: populateFormFields,
    patchIframes: patchAllIframes,
    isInIframe: function() { return IS_IN_IFRAME; },
    ghlHosts: function() { return CONFIG.ghlHosts.slice(); },
    debug: function(enable) { CONFIG.debug = enable; },
    // v1.3
    get uid() { return UID; },
    get account() { return ACCOUNT_SLUG; }
    // flushBeacon attached below
  };

  // v1.3: attach flushBeacon (after namespace + sendBeaconEvent in scope)
  if (window.JPSUTMTracker) {
    window.JPSUTMTracker.flushBeacon = function(eventType, extras) {
      return sendBeaconEvent(eventType, extras || {});
    };
  }

})();
