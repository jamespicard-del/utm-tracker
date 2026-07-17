# Changelog

All notable changes to the JPS UTM Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing in **this repo**.

---

## 🔴 TROU DE CHANGELOG — v1.4 → v1.6.4 (constaté 2026-07-16)

**Six versions ont shippé en prod sans jamais passer par ce repo ni par ce fichier.** Elles vivent
dans **`jamespicard-del/jpmetrix-cdn`** (commits directs, aucun tag, aucune entrée ici). Ce changelog
est donc **incomplet à partir de v1.4** : il ne décrit pas la version que les clients chargent.

Reconstruit depuis les messages de commit de `jpmetrix-cdn` (`git log`, 2026-07-16) :

| Version | Ce qu'elle apporte |
|---|---|
| **v1.4** | rename `jps_uid` → **`jpm_uid`** + injection de l'UID dans les forms/iframes |
| **v1.5.0** | injection `?jpm_uid=<UID>` via `history.replaceState` — contourne le fait que GHL nomme les hidden inputs par **hexId**, pas par field name |
| **v1.6.0** | `setReactiveValue()` framework-aware (setter de prototype + dispatch `input`/`change`) — requis pour que le `v-model` des forms Vue de GHL Funnel se synchronise |
| **v1.6.1** | `form_view`/`form_start` sur les forms modernes GHL rendus en `<div id="_builder-form">` ; `computeFormId` basé sur `data-q` (fieldKey) |
| **v1.6.2** | capture `_fbc`/`_fbp` (Pixel FB) → hidden fields `fbc`/`fbp` pour la dédup CAPI server-side |
| **v1.6.3** | injection URL étendue à `fbc`/`fbp`/`fbclid` (même mécanisme que v1.5) |
| **v1.6.4** | retry de l'injection sur `DOMContentLoaded` + MutationObserver — corrige une race condition (le Pixel FB pose ses cookies 50-200 ms après l'init) |

**Cause :** le pipeline `tag vX.Y.Z → Action publish-cdn.yml → jpmetrix-cdn` a été **abandonné** après
`v1.3.0` (12 mai 2026). L'Action n'est pas cassée (2 runs verts) ; personne ne l'a plus utilisée.

⚠️ Tant que la source n'est pas retranchée (voir `CONTEXT.md §FILE D'ACTIONS`), ce fichier documente
**l'historique de ce repo**, pas celui de la prod. Ne pas le compléter comme si de rien n'était.

---

## [1.3.0] - 2026-05-12

### Added
- **Persistent UID cookie (`jps_uid`):** UUID v4 generated client-side via `crypto.randomUUID()`
  (with `crypto.getRandomValues` fallback for older browsers). Cookie attributes: 30-day max-age,
  Path=/, SameSite=Lax, Secure on https. localStorage fallback at key `jps_utm_uid` (D-23).
  Read order on init: cookie → localStorage → generate fresh + persist to both. Gated by
  existing `cookiesAccepted()` GDPR check.
- **Three behavioral beacons via `navigator.sendBeacon`:**
  - `pageview` — fires once per page load on tracker init
  - `form_view` — fires when a `<form>` (with named inputs) scrolls into the viewport
    (IntersectionObserver, threshold 0.5), once per form_id per page load
  - `form_start` — fires on first focus inside any input within a `<form>`, once per
    form_id per page load
- **Beacon endpoint:** Hardcoded to `https://track.jpmetrix.com/api/beacon`. Phase 93 will
  wire the Vercel rewrite + Supabase Edge Function. Beacons silently 404 until then
  (sendBeacon is fire-and-forget; no console errors).
- **Beacon payload schema:** Standard envelope with `event`, `uid`, `account_slug`, `url`,
  `referrer`, `utm{}`, `click_ids{}`, `form_id`, `ts_client`, `v`. **No PII in payloads.**
- **`data-account` script tag attribute:** Each client can declare their account slug via
  `<script src="https://track.jpmetrix.com/v1/tracker.js" data-account="lesdecadrees"></script>`.
  Read on init; included as `account_slug` in beacon payloads. Optional — legacy installs
  without this attribute will be resolved server-side via hostname fallback (Phase 93).
- **Iframe → parent postMessage routing:** When tracker initializes in an iframe context
  (`IS_IN_IFRAME===true`), beacons are relayed to the parent window via
  `postMessage({ type: 'jps-beacon', payload: {...} })`. Parent window installs a listener
  that validates origin against `CONFIG.ghlHosts` before dispatching the beacon.
  Parent enriches the payload with its own URL + referrer (since the iframe's URL is
  typically the embed source).
- **Public API additions:**
  - `JPSUTMTracker.uid` — read-only getter; returns current UID or null if consent denied
  - `JPSUTMTracker.account` — read-only getter; returns `data-account` value or null
  - `JPSUTMTracker.flushBeacon(eventType, extras)` — debug helper to send a synthetic beacon
- **Stable form_id resolution (D-12):** For each form, `form_id` = `<form id="...">` attribute
  if set, else `'fid_' + SHA-256(sorted comma-joined input names).slice(0, 8)` via
  `crypto.subtle.digest('SHA-256', ...)` (async, cached on a WeakMap keyed by the form
  element to avoid recomputation). Same form shape produces same form_id across reloads
  (required for funnel correlation in Phase 94).

### Notes
- **Backward compat with v1.2:** All v1.2 features unchanged — UTM cookie capture,
  form auto-fill (`name` / `data-utm` / `data-q` patterns), iframe URL passthrough,
  multi-host GHL detection, custom whitelabel domain override via `data-iframe-host`,
  MutationObserver for SPA / dynamic content. Existing 5 production installs receive v1.3
  via the `/v1/` float and continue working unchanged.
- **CDN paths:** `/v1.3.0/tracker.js`, `/v1.3/tracker.js`, `/v1/tracker.js`, `/latest/tracker.js`
  all serve v1.3.0 after tag push (auto-published by jpmetrix-cdn GitHub Action).
- **File size:** ~12.6 KB (v1.2.0) → ~20.2 KB (v1.3.0). Still under 20 KB unminified budget cap (20,195 bytes / 20,480-byte cap = 285-byte headroom).
- **Dependencies:** Zero new dependencies — pure vanilla JS, IIFE wrapper, strict mode.
- **Defensive defaults:** All new code paths defensive — try/catch on every async surface,
  silent failures, debug logs gated by `CONFIG.debug=false` (default).

---

## [1.2.0] - 2026-04-28

### Added
- **Iframe URL passthrough (multi-tenant universal):** Auto-detects GHL form iframes
  on the parent site and injects UTMs + click IDs as query params into the iframe `src`
  BEFORE the iframe loads. Solves the cross-origin DOM access bug that prevented v1.x
  from filling forms embedded as iframes on third-party client websites.
- **Multi-host GHL detection:** Built-in detection of `leadconnectorhq.com`,
  `msgsndr.com`, `gohighlevel.com`, `forms.gohighlevel.com`. Substring match catches
  all subdomains (e.g. `api.leadconnectorhq.com`).
- **Custom whitelabel domain override:** Add `data-iframe-host="forms.client.com"`
  attribute on the `<script>` tag for clients using whitelabeled GHL form domains.
- **Auto-detect parent vs iframe context:** Same script, different behavior per
  context. In iframe context, only fills DOM forms. In parent context, also patches
  GHL iframe URLs.
- **MutationObserver for dynamic iframes:** New iframes added to the page after
  initial load are auto-patched.
- **Public API additions:**
  - `JPSUTMTracker.patchIframes()` — manual trigger
  - `JPSUTMTracker.isInIframe()` — context detection
  - `JPSUTMTracker.ghlHosts()` — list detected hosts

### Why this matters
This is the fix for clients who embed their GHL form as an `<iframe>` on their
own website (very common with WordPress, Webflow, custom HTML sites). Without
this passthrough, the iframe could not see UTMs from the parent URL, causing
20%+ of leads to arrive in GHL with no attribution. Tested on PMT Paysagement.

### Compatibility
- Backward compatible with v1.x — same cookie format, same `JPSUTMTracker` API
- No client-side changes required: bumping the `@v1` tag forwards everyone to
  this version automatically (jsDelivr CDN cache invalidates within ~12h)

### Technical Details
- File size: 8.6 KB → ~11 KB (still tiny)
- Zero new dependencies
- All new code wrapped in feature flags (graceful degradation)

---

## [1.0.1] - 2025-12-24

### Fixed
- **GoHighLevel Compatibility:** Added support for GHL's `data-q` attribute pattern
  - GHL generates random IDs for `name` attribute (e.g., `name="AzuUDRo8n5cKShptiPxf"`)
  - Real field key stored in `data-q` attribute (e.g., `data-q="utm_source"`)
  - Script now detects and populates fields using `data-q` attribute
  - Fixes issue where hidden fields existed but weren't populated

### Technical Details
- Added `ghlFields` selector: `document.querySelectorAll('[data-q]')`
- Populates fields where `data-q` matches UTM parameter names
- Backward compatible with standard `name` attribute and `data-utm` patterns

---

## [1.0.0] - 2025-12-24

### Added
- Initial production release
- Cookie persistence (30-day attribution window)
- localStorage fallback for cookie-blocked scenarios
- Multi-page tracking support
- Auto-populate hidden form fields
- GDPR cookie consent checking
- Error handling and debug logging
- MutationObserver for SPA/dynamic form support
- Public API (`window.JPSUTMTracker`)

### Features
- Captures 5 UTM parameters: source, medium, campaign, term, content
- Works with GoHighLevel forms (hidden fields)
- Zero dependencies (vanilla JavaScript)
- CDN-ready (jsDelivr + GitHub)
- Version control support

### Documentation
- Complete README with setup instructions
- Deployment guide for GHL clients
- Testing checklist
- Troubleshooting section

---

## Version Numbering Guide

**Format:** MAJOR.MINOR.PATCH

- **MAJOR (v2.0.0):** Breaking changes (requires client migration)
  - Example: Changing field name format, removing features

- **MINOR (v1.1.0):** New features, backward-compatible
  - Example: Adding new UTM parameter, new configuration option

- **PATCH (v1.0.1):** Bug fixes, compliance updates
  - Example: GDPR compliance fix, browser compatibility patch

**Recommendation:** Clients should use `@v1` CDN URL for auto-updates within v1.x.x

---

## Future Roadmap

### v1.1.0 (Planned)
- [ ] Support for custom UTM parameters (beyond standard 5)
- [ ] Integration with popular consent management platforms (OneTrust, Cookiebot)
- [ ] Advanced attribution (first-touch + last-touch tracking)

### v1.2.0 (Planned)
- [ ] Click ID tracking (GCLID, FBCLID, MSCLKID)
- [ ] Referrer source tracking
- [ ] Campaign performance dashboard integration

### v2.0.0 (Future - Breaking Changes)
- [ ] Server-side tracking option
- [ ] Privacy-first mode (no cookies, session-only)
- [ ] Refactor for tree-shaking and bundle size optimization

---

## Migration Guide

### Migrating from Manual Script to CDN

**Before:**
```html
<script src="/path/to/tracker.js"></script>
```

**After:**
```html
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js"></script>
```

**Steps:**
1. Replace script tag in GHL Tracking Code
2. Test with `?utm_source=test`
3. Verify form fields populate correctly
4. Remove old self-hosted file

**Time:** 5 minutes per client

---

[Unreleased]: https://github.com/jamespicard-del/utm-tracker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/jamespicard-del/utm-tracker/releases/tag/v1.0.0
