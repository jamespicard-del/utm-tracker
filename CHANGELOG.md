# Changelog

All notable changes to the JPS UTM Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

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
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>
```

**Steps:**
1. Replace script tag in GHL Tracking Code
2. Test with `?utm_source=test`
3. Verify form fields populate correctly
4. Remove old self-hosted file

**Time:** 5 minutes per client

---

[Unreleased]: https://github.com/YOUR-USERNAME/utm-tracker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR-USERNAME/utm-tracker/releases/tag/v1.0.0
