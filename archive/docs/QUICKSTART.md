# UTM Tracker - Quick Start

**Status:** ✅ LIVE - Ready to deploy to clients

**GitHub Repo:** https://github.com/jamespicard-del/utm-tracker

**CDN URL (Production):**
```
https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js
```

---

## Deploy to Client (15 min)

### Step 1: Add Tracking Code to GHL

**Settings → Tracking Code (Header section):**

```html
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js"></script>
```

### Step 2: Create 5 Hidden Fields in Forms

**Forms → Custom Fields → Add these:**

| Field Label | Field Type | Field Key (CRITICAL) |
|-------------|------------|----------------------|
| UTM Source | Hidden/Text | `utm_source` |
| UTM Medium | Hidden/Text | `utm_medium` |
| UTM Campaign | Hidden/Text | `utm_campaign` |
| UTM Term | Hidden/Text | `utm_term` |
| UTM Content | Hidden/Text | `utm_content` |

**IMPORTANT:** Field Key must match exactly (case-sensitive)

### Step 3: Test

Visit landing page with:
```
?utm_source=test&utm_campaign=deployment-test
```

Submit form → Check GHL contact custom fields

---

## Next Steps

1. **Deploy to first client** (use steps above)
2. **Test thoroughly** (see `docs/TESTING.md`)
3. **Deploy to remaining clients** (15 min each)

---

## Future Updates

When you need to update the script:

```bash
cd utm-tracker
vim v1/tracker.js
git commit -m "v1.1.0: Description"
git tag v1.1.0
git push --tags
```

**All clients auto-updated in 24-48h** ✅

---

## Documentation

- **Full README:** [README.md](README.md)
- **Deployment Guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Testing Guide:** [docs/TESTING.md](docs/TESTING.md)
- **GitHub Setup:** [GITHUB-SETUP.md](GITHUB-SETUP.md)

---

**Created:** 2025-12-24
**Version:** 1.0.0
**Status:** Production Ready 🚀
