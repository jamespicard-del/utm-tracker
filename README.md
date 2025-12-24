# JPS UTM Attribution Tracker

**Production-ready UTM parameter tracking for GoHighLevel clients**

Automatically captures UTM parameters from URLs and populates hidden form fields for accurate marketing attribution.

---

## Features

✅ **Cookie Persistence** - 30-day tracking across multiple pages
✅ **localStorage Fallback** - Works even if cookies are blocked
✅ **Multi-Page Tracking** - User can navigate before submitting form
✅ **Auto-Populate Fields** - Zero configuration needed after setup
✅ **GDPR-Ready** - Cookie consent checking built-in
✅ **Error Handling** - Robust with debug logging
✅ **SPA Support** - Detects dynamically loaded forms
✅ **Zero Dependencies** - Pure vanilla JavaScript

---

## Quick Start

### Option 1: CDN (Recommended for Production)

**Add to GHL Tracking Code:**

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>
```

**Benefits:**
- Auto-updates when you push to GitHub
- Zero maintenance per client
- Global CDN (fast loading)
- Version control (rollback if needed)

### Option 2: Self-Hosted

Download `v1/tracker.js` and upload to your server:

```html
<script src="https://yourdomain.com/tracker.js"></script>
```

---

## Documentation Complète

**Guides d'installation et configuration:**

- **[Installation GHL (15 min)](docs/INSTALLATION.md)** - Comment installer le script sur GoHighLevel et créer les champs cachés
- **[Configuration Facebook Ads (5 min)](docs/FACEBOOK-SETUP.md)** - Template UTM avec paramètres dynamiques Facebook
- **[Configuration Google Ads (5 min)](docs/GOOGLE-ADS-SETUP.md)** - Template UTM avec paramètres dynamiques Google + auto-tagging

---

## CDN Setup (jsDelivr + GitHub)

### Step 1: Create GitHub Repo

```bash
# Create new repo on GitHub: utm-tracker
# Clone locally
git clone https://github.com/YOUR-USERNAME/utm-tracker.git
cd utm-tracker

# Copy files from this directory
cp -r v1 README.md CHANGELOG.md utm-tracker/

# Commit and push
git add .
git commit -m "v1.0.0: Initial release"
git tag v1.0.0
git push origin main --tags
```

### Step 2: Get CDN URL

Your tracker is now available at:

```
https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js
```

**Versioning Options:**

| URL Pattern | Behavior | Use Case |
|-------------|----------|----------|
| `@latest` | Latest commit on main | Testing/development |
| `@v1` | Latest v1.x.x tag | **Production (recommended)** |
| `@v1.0.0` | Specific version | Frozen version |

### Step 3: Deploy to Clients

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full client setup guide.

---

## Client Setup (15 min per client)

### 1. Add Tracking Code to GHL

**Settings → Tracking Code (or Custom Code section):**

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>
```

### 2. Create Hidden Fields in Forms

**Forms → Custom Fields → Add 5 Hidden Fields:**

| Field Name | Type | Field Key |
|------------|------|-----------|
| UTM Source | Hidden | `utm_source` |
| UTM Medium | Hidden | `utm_medium` |
| UTM Campaign | Hidden | `utm_campaign` |
| UTM Term | Hidden | `utm_term` |
| UTM Content | Hidden | `utm_content` |

**IMPORTANT:** Field Key (name attribute) MUST match exactly: `utm_source`, `utm_medium`, etc.

### 3. Test

Visit landing page with UTM parameters:

```
https://client-landing.com?utm_source=facebook&utm_campaign=test
```

Submit form and verify in GHL contact that custom fields are populated.

---

## How It Works

### User Journey Flow

```
1. User clicks ad with UTM params
   → https://landing.com?utm_source=facebook&utm_campaign=winter

2. tracker.js loads and captures UTM from URL
   → Saves to cookies (30 days) + localStorage (backup)

3. User navigates to multiple pages (UTM persists in cookies)

4. User arrives at form page
   → tracker.js auto-populates hidden fields with cookie data

5. User fills form (name, email, etc.) and submits

6. GHL webhook fires with UTM data included:
   {
     "name": "Jean Tremblay",
     "email": "jean@gmail.com",
     "utm_source": "facebook",
     "utm_campaign": "winter"
   }

7. Your Supabase webhook receives data
   → leads_staging → private.leads (UTM columns populated)

8. Analytics MVs use UTM data for attribution reports
```

### Multi-Page Tracking Example

```
Page 1 (Landing): https://site.com?utm_source=google
  → Script captures & stores in cookie

Page 2 (About): https://site.com/about
  → No UTM in URL, but cookie still exists

Page 3 (Contact Form): https://site.com/contact
  → Script reads cookie, populates hidden fields
  → User submits → Attribution to Google ✅
```

**Without cookie persistence:** UTM lost between pages
**With cookie persistence:** 30-day attribution window

---

## Updating the Script

### For Bug Fixes or Compliance Updates

```bash
# 1. Edit tracker.js locally
vim v1/tracker.js

# 2. Commit with semantic versioning
git add v1/tracker.js
git commit -m "v1.1.0: Add Quebec cookie consent compliance"

# 3. Tag new version
git tag v1.1.0

# 4. Push to GitHub
git push origin main --tags

# 5. Wait 5-10 minutes for jsDelivr cache refresh

# ✅ All clients on @v1 auto-updated
```

**Clients using `@v1`:** Auto-updated to v1.1.0
**Clients using `@v1.0.0`:** Remain on v1.0.0 (frozen)

### Cache Propagation

- **jsDelivr refresh:** 5-10 minutes
- **Browser cache:** 24-48 hours (users will get update on next visit)

For **critical updates**, notify clients to clear cache (Ctrl+F5).

---

## Configuration Options

### Enable Debug Logging

Add this after the script tag to see console logs:

```html
<script>
  JPSUTMTracker.debug(true);
</script>
```

### Custom Cookie Consent Integration

Edit `tracker.js` line 47 to integrate with your consent platform:

```javascript
function cookiesAccepted() {
  // Example: OneTrust integration
  return window.OptanonActiveGroups && window.OptanonActiveGroups.includes('C0002');

  // Example: Custom consent cookie
  return getCookie('my_cookie_consent') === 'true';
}
```

---

## Troubleshooting

### UTM Not Captured

**Check:**
1. Script loaded? (View source → search for `tracker.js`)
2. UTM in URL? (Must have `?utm_source=...`)
3. Cookies enabled? (Check browser settings)
4. Debug mode enabled? (See console logs)

### Fields Not Populated

**Check:**
1. Field Key matches exactly (`utm_source` not `UTM_Source`)
2. Field type is Hidden or Text (not Dropdown/Radio)
3. Form loaded after script? (Should work with MutationObserver)
4. Multiple forms? (All forms need hidden fields)

### Multi-Page Not Working

**Check:**
1. All pages have same tracking code
2. Cookies not blocked by browser
3. Domain/subdomain consistent (cookies are domain-specific)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full troubleshooting guide.

---

## Architecture

### File Structure

```
utm-tracker/
├── v1/
│   └── tracker.js          # Production script (v1.x.x)
├── v2/                     # Future major version (breaking changes)
├── docs/
│   ├── DEPLOYMENT.md       # Client setup guide
│   └── TESTING.md          # Testing checklist
├── README.md               # This file
└── CHANGELOG.md            # Version history
```

### Versioning Strategy

- **v1.x.x:** Bug fixes, minor features, compliance updates (auto-update safe)
- **v2.0.0:** Breaking changes (requires manual client migration)

**Recommendation:** Use `@v1` for all production clients.

---

## Cost Analysis

### CDN Centralized (This Solution)

| Metric | Cost |
|--------|------|
| Setup (GitHub + jsDelivr) | 15 min one-time |
| Per client deploy | 15 min |
| Update 10 clients | **5 min** (1 git push) |
| Annual cost | **$0** |

### Alternative: Script Copy/Paste

| Metric | Cost |
|--------|------|
| Per client deploy | 15 min |
| Update 10 clients | **150 min** (15 min × 10) |
| Annual cost | **$0** |

**Time saved per update:** 145 minutes (2.4 hours)

### Alternative: SaaS Tool (LeadSources.io, etc.)

| Metric | Cost |
|--------|------|
| Per client setup | 10 min |
| Maintenance | 0 min |
| Annual cost | **$5,900** (10 clients × $49/month) |

**Savings with this solution:** $5,900/year + full control

---

## Support

- **Issues:** Open GitHub issue in utm-tracker repo
- **Questions:** See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Updates:** Watch CHANGELOG.md for new releases

---

## License

MIT License - Use freely for commercial projects

---

**Built for JPS clients** | Production-ready | Zero dependencies | $0 cost
