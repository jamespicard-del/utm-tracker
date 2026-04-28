# Changelog

All notable changes to the JPS UTM Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

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
