# GitHub + jsDelivr Setup Guide

**5-minute setup to activate CDN auto-updates for all clients**

---

## Step 1: Create GitHub Repository (2 min)

### Option A: GitHub Web Interface

1. Go to: https://github.com/new
2. Repository name: `utm-tracker`
3. Description: `UTM attribution tracking for GHL clients`
4. Visibility: **Public** ✅ (required for jsDelivr)
5. Click **Create repository**

### Option B: GitHub CLI

```bash
gh repo create utm-tracker --public --description "UTM attribution tracking for GHL clients"
```

---

## Step 2: Upload Files to GitHub (3 min)

### Clone Your New Repo

```bash
# Replace jamespicard-del with your GitHub username
git clone https://github.com/jamespicard-del/utm-tracker.git
cd utm-tracker
```

### Copy Files from This Directory

```bash
# From your JPS_produit directory
cp -r utm-tracker/* ~/path/to/utm-tracker/

# Or manually copy these files:
# - v1/tracker.js
# - docs/DEPLOYMENT.md
# - docs/TESTING.md
# - README.md
# - CHANGELOG.md
```

### Initial Commit

```bash
cd ~/path/to/utm-tracker

# Add all files
git add .

# Commit with version tag
git commit -m "v1.0.0: Initial production release

- Cookie persistence (30-day attribution)
- localStorage fallback
- Multi-page tracking
- Auto-populate GHL hidden fields
- GDPR-ready
- SPA support with MutationObserver"

# Tag version 1.0.0
git tag v1.0.0

# Push to GitHub (main branch + tags)
git push origin main --tags
```

---

## Step 3: Verify jsDelivr CDN (1 min)

### Wait 2-3 Minutes

jsDelivr needs time to index your repo.

### Test CDN URL

Visit this URL in your browser (replace jamespicard-del):

```
https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js
```

**Expected:** You see the JavaScript code for tracker.js

**If 404:** Wait 5 more minutes, then try again. New repos can take up to 10 min to index.

### Alternative URLs to Try

```
# Latest tag
https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@latest/v1/tracker.js

# Specific version
https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@1.0.0/v1/tracker.js

# Latest commit on main
https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@main/v1/tracker.js
```

**For production, use:** `@v1` (auto-updates within v1.x.x)

---

## Step 4: Deploy to First Client (15 min)

### Get Your Production CDN URL

```
https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js
```

Copy this URL - you'll use it for all clients.

### Follow Deployment Guide

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for complete client setup.

**Quick summary:**
1. Add tracking code to GHL (Settings → Tracking Code)
2. Create 5 hidden fields in form (utm_source, utm_medium, etc.)
3. Test with `?utm_source=test`

---

## Future Updates Workflow

### Making Changes to tracker.js

```bash
cd ~/path/to/utm-tracker

# 1. Edit tracker.js
vim v1/tracker.js

# 2. Test locally (optional - open in browser)
open v1/tracker.js

# 3. Update CHANGELOG.md
vim CHANGELOG.md
# Add entry for new version

# 4. Commit with semantic versioning
git add v1/tracker.js CHANGELOG.md
git commit -m "v1.1.0: Add GDPR cookie consent integration"

# 5. Tag new version
git tag v1.1.0

# 6. Push to GitHub
git push origin main --tags
```

### Version Numbering Guide

**Format:** MAJOR.MINOR.PATCH

- **v1.0.1** = Bug fix (clients auto-update)
- **v1.1.0** = New feature, backward-compatible (clients auto-update)
- **v2.0.0** = Breaking change (clients need manual migration)

### Propagation Timeline

| Platform | Update Time |
|----------|-------------|
| GitHub | Instant |
| jsDelivr CDN | 5-10 minutes |
| Client browsers | Next page load (or 24-48h if cached) |

**Result:** All clients on `@v1` get update automatically within 24-48h.

---

## Versioning Strategies

### Strategy 1: Auto-Update (Recommended)

**Client uses:**
```html
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js"></script>
```

**Behavior:**
- ✅ Bug fixes auto-deploy
- ✅ New features auto-deploy
- ❌ Breaking changes require manual migration (v1 → v2)

**Use for:** 90% of clients

### Strategy 2: Frozen Version

**Client uses:**
```html
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@1.0.0/v1/tracker.js"></script>
```

**Behavior:**
- ❌ No auto-updates
- ✅ Full control over when to update

**Use for:** Clients with custom modifications

### Strategy 3: Latest (Testing Only)

**Client uses:**
```html
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@latest/v1/tracker.js"></script>
```

**Behavior:**
- ✅ Every commit auto-deploys (no tags needed)
- ⚠️ Less stable, not recommended for production

**Use for:** Your own test site, pilot clients

---

## Git Branch Strategy (Optional)

### Simple (Recommended for Solo Dev)

```
main
  ↓
  All development + production
  Tags: v1.0.0, v1.1.0, v1.2.0
```

### Advanced (Team or Multiple Versions)

```
main (production stable)
  ↓
  v1/ branch (v1.x.x releases)
  v2/ branch (v2.x.x releases)

develop (testing, pre-release)
```

**Workflow:**
1. Develop on `develop` branch
2. Test thoroughly
3. Merge to `main` when ready
4. Tag version on `main`

---

## Troubleshooting

### CDN Returns 404

**Causes:**
- Repo is private (must be public)
- jsDelivr hasn't indexed yet (wait 10 min)
- Wrong URL format

**Fix:**
1. Check repo is public on GitHub
2. Wait 10 minutes after first push
3. Try alternative URL formats (see Step 3)

### Old Version Still Loading

**Cause:** CDN cache not invalidated yet

**Fix:**
1. Wait 10 more minutes
2. Force purge: Add `?purge=true` to CDN URL
   ```
   https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js?purge=true
   ```
3. Visit URL in incognito mode (bypass browser cache)

### Clients Not Getting Updates

**Causes:**
- Client using frozen version (`@1.0.0`)
- Browser cache (24-48h delay normal)
- Client script tag wrong

**Fix:**
1. Verify client uses `@v1` not `@1.0.0`
2. Check client site source code (View Source)
3. Wait 48h for browser cache refresh
4. Or notify client to hard refresh (Ctrl+F5)

---

## Security Considerations

### Public Repo Risks

**Your code is public** - anyone can see tracker.js

**Mitigations:**
- ✅ No secrets in code (API keys, passwords)
- ✅ No client-specific logic
- ✅ Generic tracking only
- ✅ This is fine - tracking scripts are meant to be public (like Google Analytics)

**NOT recommended for public repo:**
- ❌ API keys
- ❌ Client business logic
- ❌ Proprietary algorithms

### CDN Trust

**You're trusting jsDelivr** to serve your script.

**Alternatives if concerned:**
1. Self-host on your own server
2. Use Cloudflare Workers (free tier)
3. Host on client's domain directly

**jsDelivr track record:**
- Used by millions of sites
- 99.9%+ uptime
- Free forever (OSS-focused)

---

## Cost Analysis

### GitHub (Free Tier)

- ✅ Unlimited public repos
- ✅ Unlimited bandwidth
- ✅ Git LFS 1GB (not needed)

**Cost:** $0/month

### jsDelivr CDN (Free)

- ✅ Unlimited bandwidth
- ✅ Global CDN (edge locations)
- ✅ No rate limits for OSS

**Cost:** $0/month

### Total Cost

**Setup:** 5 min one-time
**Per-client deploy:** 15 min
**Updates:** 5 min (all clients auto-update)
**Monthly cost:** **$0**

**vs SaaS alternatives:** $5,900/year for 10 clients

**Savings:** $5,900/year + full control

---

## Next Steps

✅ **You're Done!**

Your CDN is live at:
```
https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js
```

**Now:**
1. Deploy to first client (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))
2. Test thoroughly (see [docs/TESTING.md](docs/TESTING.md))
3. Deploy to remaining clients (15 min each)
4. Update script as needed (1 git push = all clients updated)

---

## Support Resources

- **GitHub Help:** https://docs.github.com
- **jsDelivr Docs:** https://www.jsdelivr.com/documentation
- **Git Basics:** https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control

---

**Setup completed!** 🎉

You now have:
- ✅ Production-ready UTM tracker
- ✅ Global CDN (fast loading)
- ✅ Auto-updates (1 push = all clients)
- ✅ $0 monthly cost
- ✅ Full control & ownership

**Time to deploy to clients.**
