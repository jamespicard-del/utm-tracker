# Client Deployment Guide

**Step-by-step instructions for deploying JPS UTM Tracker to GHL client accounts**

**Time:** 15 minutes per client
**Difficulty:** Easy (copy/paste)

---

## Prerequisites

✅ Access to client GHL account (Agency/Sub-account admin)
✅ CDN URL ready (see main README for GitHub setup)
✅ Client has at least 1 form on their funnel/website

---

## Part 1: Add Tracking Code (5 min)

### Step 1: Login to Client GHL Account

Navigate to: **Settings → Tracking Code**

(Some GHL versions: **Settings → Custom Code** or **Funnels → Settings → Custom Code**)

### Step 2: Add Script Tag

**Paste this in the "Header Tracking Code" section:**

```html
<!-- JPS UTM Attribution Tracker v1 -->
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>
```

**Replace `YOUR-USERNAME` with your actual GitHub username.**

**Important:**
- ✅ Place in `<head>` section (Header Tracking Code)
- ✅ Use `@v1` for auto-updates within v1.x.x
- ❌ Don't use `@latest` in production (less stable)

### Step 3: Save Changes

Click **Save** or **Update** button.

---

## Part 2: Create Hidden Fields (10 min)

### Step 4: Navigate to Forms

**Sites → Funnels → [Client Funnel] → Forms**

Or: **Forms → [Select Form]**

### Step 5: Add Custom Fields

For EACH form that needs attribution tracking, add these 5 custom fields:

#### Field 1: UTM Source

- **Field Label:** UTM Source
- **Field Type:** Custom Field → Text (or Hidden if available)
- **Field Key/Name:** `utm_source`
- **Required:** No
- **Placeholder:** (leave empty)
- **Default Value:** (leave empty)
- **Make field hidden:** ✅ YES

#### Field 2: UTM Medium

- **Field Label:** UTM Medium
- **Field Type:** Custom Field → Text (or Hidden)
- **Field Key/Name:** `utm_medium`
- **Required:** No
- **Make field hidden:** ✅ YES

#### Field 3: UTM Campaign

- **Field Label:** UTM Campaign
- **Field Type:** Custom Field → Text (or Hidden)
- **Field Key/Name:** `utm_campaign`
- **Required:** No
- **Make field hidden:** ✅ YES

#### Field 4: UTM Term

- **Field Label:** UTM Term
- **Field Type:** Custom Field → Text (or Hidden)
- **Field Key/Name:** `utm_term`
- **Required:** No
- **Make field hidden:** ✅ YES

#### Field 5: UTM Content

- **Field Label:** UTM Content
- **Field Type:** Custom Field → Text (or Hidden)
- **Field Key/Name:** `utm_content`
- **Required:** No
- **Make field hidden:** ✅ YES

### Critical: Field Key MUST Match

The **Field Key** (or `name` attribute) MUST be exactly:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

**Case-sensitive!** `utm_source` ✅ | `UTM_Source` ❌ | `utmsource` ❌

### Step 6: Save Form

Click **Save Form** or **Update**.

### Step 7: Repeat for Additional Forms

If client has multiple forms (e.g., Contact Form, Quote Request, Newsletter), repeat Step 5-6 for each.

---

## Part 3: Testing (5 min)

### Step 8: Test URL

Visit client's landing page with test UTM parameters:

```
https://client-landing-page.com?utm_source=test&utm_medium=manual&utm_campaign=deployment-test
```

**Replace** `client-landing-page.com` with actual client URL.

### Step 9: Open Browser Console

Press `F12` (Chrome/Firefox) → Console tab

You should see (if debug enabled):

```
[UTM Tracker] UTM Tracker v1.0.0 initializing...
[UTM Tracker] UTM parameters captured {utm_source: "test", utm_medium: "manual", utm_campaign: "deployment-test"}
[UTM Tracker] Populated field: utm_source = test
[UTM Tracker] Populated field: utm_medium = manual
[UTM Tracker] Populated field: utm_campaign = deployment-test
```

### Step 10: Inspect Hidden Fields

In Console, run:

```javascript
document.querySelectorAll('input[name^="utm_"]')
```

You should see 5 input elements with values populated.

**OR** use Chrome DevTools:
1. Right-click form → Inspect
2. Find `<input type="hidden" name="utm_source" value="test">`
3. Verify all 5 fields have values

### Step 11: Submit Test Form

Fill out the form with test data and submit.

### Step 12: Verify in GHL Contact

**Contacts → [Find Test Contact] → Custom Fields**

Verify that UTM fields are populated:

- UTM Source: `test`
- UTM Medium: `manual`
- UTM Campaign: `deployment-test`

### Step 13: Verify in Webhook (Optional)

If webhook to Supabase is configured:

**Check `leads_staging` table:**

```sql
SELECT
  contact_name,
  utm_source,
  utm_medium,
  utm_campaign,
  created_at
FROM public.leads_staging
ORDER BY created_at DESC
LIMIT 5;
```

Verify test lead has UTM data.

---

## Multi-Page Tracking Test (Optional)

### Step 14: Test Cookie Persistence

1. Visit: `https://client-site.com?utm_source=facebook&utm_campaign=winter`
2. Navigate to: `https://client-site.com/about` (no UTM in URL)
3. Navigate to: `https://client-site.com/contact` (form page)
4. Inspect hidden fields → Should still have `utm_source=facebook`
5. Submit form → Verify attribution persists

**Expected:** UTM captured on Page 1, persists to Page 3 via cookies.

---

## Troubleshooting

### Script Not Loading

**Check:**
- [ ] Script tag in correct location (Header Tracking Code)
- [ ] No typos in CDN URL
- [ ] GitHub repo is public
- [ ] View page source → search for `tracker.js` (should be in `<head>`)

**Fix:** Re-paste script tag, ensure URL is correct.

### Fields Not Populating

**Check:**
- [ ] Field Key matches exactly (`utm_source` not `UTM_SOURCE`)
- [ ] Fields are type Text or Hidden (not Dropdown/Radio)
- [ ] Form loaded after script (should work with MutationObserver)
- [ ] Cookies enabled in browser
- [ ] URL has UTM parameters (`?utm_source=...`)

**Fix:**
- Verify Field Key in form settings
- Test in Incognito mode (fresh cookies)
- Enable debug: `JPSUTMTracker.debug(true)` in console

### Multi-Page Not Working

**Check:**
- [ ] All pages have same tracking code
- [ ] Domain/subdomain consistent (cookies are domain-specific)
- [ ] Third-party cookies not blocked

**Fix:**
- Ensure tracking code on ALL pages (not just landing page)
- Test with same domain (not subdomain switch)

### Console Errors

**Common errors:**

**Error:** `Uncaught ReferenceError: JPSUTMTracker is not defined`
**Fix:** Script not loaded. Check CDN URL and network tab.

**Error:** `Failed to set cookie`
**Fix:** Cookies blocked by browser. Script will fallback to localStorage.

**Error:** `CORS policy`
**Fix:** Should not happen with jsDelivr. Check CDN URL format.

---

## Advanced Configuration

### Enable Debug Logging

Add after script tag:

```html
<script>
  // Enable debug logs in console
  JPSUTMTracker.debug(true);
</script>
```

### Custom Cookie Consent Integration

If client uses cookie consent platform (OneTrust, Cookiebot), edit `tracker.js`:

```javascript
function cookiesAccepted() {
  // Example: OneTrust
  return window.OptanonActiveGroups && window.OptanonActiveGroups.includes('C0002');

  // Example: Cookiebot
  return window.Cookiebot && window.Cookiebot.consent.marketing;
}
```

### Alternative Field Naming

If client uses different field names (e.g., `source` instead of `utm_source`), you can:

**Option 1:** Add `data-utm` attribute to field:

```html
<input type="hidden" name="source" data-utm="utm_source" />
```

Script will auto-populate via `data-utm` attribute.

**Option 2:** Map fields manually (edit tracker.js):

```javascript
const fieldMapping = {
  'source': 'utm_source',
  'medium': 'utm_medium',
  // etc.
};
```

---

## Deployment Checklist

Use this checklist for each client:

### Pre-Deployment
- [ ] GitHub repo setup with CDN URL
- [ ] Access to client GHL account
- [ ] Test URL prepared

### Deployment
- [ ] Added tracking code to Header section
- [ ] Created 5 custom hidden fields in form(s)
- [ ] Verified Field Keys match exactly
- [ ] Saved all changes

### Testing
- [ ] Visited test URL with UTM parameters
- [ ] Inspected hidden fields (values populated)
- [ ] Submitted test form
- [ ] Verified in GHL contact custom fields
- [ ] Tested multi-page persistence (optional)

### Post-Deployment
- [ ] Documented client deployment (date, version)
- [ ] Notified client (optional)
- [ ] Monitored for issues (first 24-48h)

---

## Client Template (Copy/Paste)

### Email to Client (Optional)

```
Subject: Attribution Tracking Activated

Hi [Client Name],

We've activated marketing attribution tracking on your GoHighLevel account.

What this means:
- All form submissions now capture where the lead came from (Facebook, Google, etc.)
- You'll see detailed attribution data in your analytics dashboard
- Zero impact on your forms (works automatically in the background)

No action needed on your end. The system is working automatically.

Let me know if you have any questions!

Best,
[Your Name]
```

---

## Batch Deployment (Multiple Clients)

If deploying to 5+ clients, use this workflow:

### 1. Prepare Template Form

Create a "UTM Template Form" in your agency account with all 5 hidden fields configured correctly.

### 2. Clone to Clients

Use GHL's form clone feature to copy template to each client.

### 3. Script Deploy via API (Advanced)

For 10+ clients, consider GHL API automation:

```bash
#!/bin/bash
# deploy-tracking-code.sh

CLIENTS=("client1_location_id" "client2_location_id")
SCRIPT_TAG='<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>'

for client in "${CLIENTS[@]}"; do
  curl -X PUT "https://services.leadconnectorhq.com/locations/$client/settings" \
    -H "Authorization: Bearer $GHL_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"headerTrackingCode\": \"$SCRIPT_TAG\"}"
done
```

**Time savings:** 5 min per client vs 15 min manual = 50 min saved for 10 clients.

---

## Maintenance

### Monthly Check (5 min)

- [ ] Verify script still loading (spot check 2-3 client sites)
- [ ] Check for console errors
- [ ] Review attribution data quality in analytics

### When to Update

**Update clients when:**
- New version released (check CHANGELOG.md)
- Bug fix or compliance update
- Feature addition needed

**Clients on `@v1`:** Auto-updated (zero action)
**Clients on `@v1.0.0`:** Manual update required

---

## Support

**Issues during deployment?**
1. Check this troubleshooting section
2. Enable debug mode and check console
3. Review main README.md
4. Open GitHub issue if bug suspected

---

**Template created:** 2025-12-24
**Last updated:** 2025-12-24
**Version:** 1.0.0
