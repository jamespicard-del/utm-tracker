# Testing & Validation Guide

**Comprehensive testing checklist for JPS UTM Tracker**

Use this guide to validate that the tracker works correctly before deploying to production clients.

---

## Pre-Deployment Testing (Local/Staging)

### Test 1: Script Loads Successfully

**Objective:** Verify script loads without errors

**Steps:**
1. Open client landing page in browser
2. Open DevTools (F12) → Network tab
3. Refresh page (Ctrl+R)
4. Search for `tracker.js` in network requests

**Expected Result:**
- ✅ tracker.js loaded (Status: 200)
- ✅ Size: ~8-10 KB
- ✅ No console errors

**Fail Criteria:**
- ❌ 404 Not Found (CDN URL wrong)
- ❌ CORS error (shouldn't happen with jsDelivr)
- ❌ Script blocked by ad blocker (rare, use incognito)

---

### Test 2: UTM Capture from URL

**Objective:** Verify script captures UTM parameters from URL

**Steps:**
1. Enable debug mode in console:
   ```javascript
   JPSUTMTracker.debug(true);
   ```
2. Visit test URL:
   ```
   https://client-site.com?utm_source=facebook&utm_medium=cpc&utm_campaign=winter-promo&utm_term=plumber&utm_content=ad-variant-a
   ```
3. Check console logs

**Expected Result:**
```
[UTM Tracker] UTM Tracker v1.0.0 initializing...
[UTM Tracker] UTM parameters captured {
  utm_source: "facebook",
  utm_medium: "cpc",
  utm_campaign: "winter-promo",
  utm_term: "plumber",
  utm_content: "ad-variant-a"
}
[UTM Tracker] Cookie set: utm_source=facebook
[UTM Tracker] Cookie set: utm_medium=cpc
[UTM Tracker] Cookie set: utm_campaign=winter-promo
[UTM Tracker] Cookie set: utm_term=plumber
[UTM Tracker] Cookie set: utm_content=ad-variant-a
```

**Fail Criteria:**
- ❌ "No UTM parameters found" (check URL)
- ❌ "Cookies not accepted" (check GDPR config)
- ❌ No console logs (debug mode not enabled)

---

### Test 3: Cookie Persistence

**Objective:** Verify UTM data stored in cookies

**Steps:**
1. After Test 2, open DevTools → Application tab
2. Navigate to: Storage → Cookies → [client domain]
3. Look for UTM cookies

**Expected Result:**
- ✅ 5 cookies exist: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- ✅ Values match URL parameters
- ✅ Expiry: ~30 days from now
- ✅ Path: `/`

**Verify with console:**
```javascript
document.cookie.split(';').filter(c => c.includes('utm_'));
```

**Fail Criteria:**
- ❌ Cookies not set (check browser settings)
- ❌ Wrong expiry (should be 30 days)
- ❌ Missing cookies (check GDPR consent)

---

### Test 4: localStorage Fallback

**Objective:** Verify localStorage works if cookies blocked

**Steps:**
1. Block third-party cookies in browser settings
2. Visit test URL with UTM parameters
3. DevTools → Application → Local Storage → [client domain]

**Expected Result:**
- ✅ 5 localStorage items: `jps_utm_source`, `jps_utm_medium`, etc.
- ✅ Values match URL parameters

**Verify with console:**
```javascript
Object.keys(localStorage).filter(k => k.startsWith('jps_utm_'));
```

**Fail Criteria:**
- ❌ No localStorage items (script error)
- ❌ Wrong prefix (should be `jps_utm_`)

---

### Test 5: Hidden Fields Auto-Populate

**Objective:** Verify script populates hidden form fields

**Steps:**
1. After Test 2 (cookies set), navigate to form page
2. Open DevTools → Console
3. Inspect hidden fields:
   ```javascript
   document.querySelectorAll('input[name^="utm_"]').forEach(f => console.log(f.name, f.value));
   ```

**Expected Result:**
```
utm_source facebook
utm_medium cpc
utm_campaign winter-promo
utm_term plumber
utm_content ad-variant-a
```

**Alternative inspection:**
- DevTools → Elements → Find `<input type="hidden" name="utm_source">`
- Verify `value="facebook"`

**Fail Criteria:**
- ❌ Empty values (check Field Key matches)
- ❌ Fields not found (check form has hidden fields)
- ❌ Wrong values (check cookies/localStorage)

---

### Test 6: Form Submission & GHL Contact

**Objective:** Verify UTM data reaches GHL contact

**Steps:**
1. Fill out form with test data:
   - Name: Test User
   - Email: test@example.com
   - Phone: 555-1234
2. Submit form
3. In GHL, navigate to: Contacts → Search "test@example.com"
4. Open contact → Custom Fields section

**Expected Result:**
- ✅ Contact created successfully
- ✅ UTM Source: `facebook`
- ✅ UTM Medium: `cpc`
- ✅ UTM Campaign: `winter-promo`
- ✅ UTM Term: `plumber`
- ✅ UTM Content: `ad-variant-a`

**Fail Criteria:**
- ❌ Custom fields empty (check field mapping)
- ❌ Custom fields don't exist (create in GHL)
- ❌ Wrong values (check form submission payload)

---

### Test 7: Webhook to Supabase (Optional)

**Objective:** Verify UTM data reaches database

**Steps:**
1. After Test 6, query `leads_staging` table:
   ```sql
   SELECT
     contact_name,
     contact_email,
     utm_source,
     utm_medium,
     utm_campaign,
     utm_term,
     utm_content,
     created_at
   FROM public.leads_staging
   WHERE contact_email = 'test@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Expected Result:**
- ✅ Row exists with correct UTM values
- ✅ All 5 UTM columns populated
- ✅ `created_at` recent (within last 5 min)

**Fail Criteria:**
- ❌ Row not found (check webhook config)
- ❌ UTM columns NULL (check GHL custom field mapping)
- ❌ Wrong values (check webhook payload)

---

## Multi-Page Tracking Tests

### Test 8: Cookie Persistence Across Pages

**Objective:** Verify UTM persists when user navigates

**Steps:**
1. Visit Page 1 (landing) with UTM:
   ```
   https://client-site.com?utm_source=google&utm_campaign=summer
   ```
2. Click link to Page 2 (about):
   ```
   https://client-site.com/about
   ```
   (Note: No UTM in URL)
3. Click link to Page 3 (contact form):
   ```
   https://client-site.com/contact
   ```
4. Inspect hidden fields on Page 3

**Expected Result:**
- ✅ Page 1: Cookies set (`utm_source=google`)
- ✅ Page 2: Cookies still exist (check DevTools)
- ✅ Page 3: Hidden fields populated with `utm_source=google`

**Fail Criteria:**
- ❌ Cookies lost between pages (check domain consistency)
- ❌ Fields not populated on Page 3 (check tracking code on all pages)

---

### Test 9: 30-Day Attribution Window

**Objective:** Verify cookies persist for 30 days

**Steps:**
1. Visit landing page with UTM parameters
2. Note current date/time
3. Check cookie expiry in DevTools:
   - Application → Cookies → `utm_source` → Expires

**Expected Result:**
- ✅ Expiry date: ~30 days from now
- ✅ Cookie remains valid for 30 days

**Fast-forward test (optional):**
- Manually set system clock forward 29 days
- Refresh page → cookies should still exist
- Submit form → attribution should still work

**Fail Criteria:**
- ❌ Expiry too short (<30 days)
- ❌ Cookies expire on session end (check max-age)

---

## Edge Case Testing

### Test 10: No UTM Parameters (Organic Traffic)

**Objective:** Verify tracker handles organic traffic gracefully

**Steps:**
1. Visit landing page WITHOUT UTM:
   ```
   https://client-site.com
   ```
2. Check console logs (debug mode)
3. Submit form

**Expected Result:**
- ✅ Console: "No UTM parameters found in URL"
- ✅ Hidden fields remain empty (or default values)
- ✅ Form submits successfully (no errors)
- ✅ GHL contact created with empty UTM fields

**Fail Criteria:**
- ❌ JavaScript error
- ❌ Form submission fails
- ❌ Script crashes

---

### Test 11: Partial UTM Parameters

**Objective:** Verify tracker handles incomplete UTM sets

**Steps:**
1. Visit URL with only `utm_source`:
   ```
   https://client-site.com?utm_source=instagram
   ```
2. Inspect cookies and fields

**Expected Result:**
- ✅ Only `utm_source` cookie set
- ✅ Only `utm_source` field populated
- ✅ Other fields remain empty
- ✅ Form submits successfully

**Fail Criteria:**
- ❌ Script error on partial UTM
- ❌ Other fields show "undefined"

---

### Test 12: Special Characters in UTM

**Objective:** Verify URL encoding/decoding works

**Steps:**
1. Visit URL with special characters:
   ```
   https://client-site.com?utm_campaign=été-2025&utm_content=50%+off
   ```
2. Check cookie values
3. Check form field values

**Expected Result:**
- ✅ Cookies store URL-encoded values
- ✅ Fields show decoded values: `été-2025`, `50% off`
- ✅ Form submits successfully
- ✅ GHL contact shows readable values

**Fail Criteria:**
- ❌ Malformed encoding (`%C3%A9t%C3%A9` instead of `été`)
- ❌ Form submission fails
- ❌ Data loss

---

### Test 13: Multiple Forms on Same Page

**Objective:** Verify tracker populates all forms

**Steps:**
1. Create page with 2 forms (e.g., header + footer contact forms)
2. Visit with UTM parameters
3. Inspect both forms' hidden fields

**Expected Result:**
- ✅ Form 1: All UTM fields populated
- ✅ Form 2: All UTM fields populated
- ✅ Both forms submit correctly

**Fail Criteria:**
- ❌ Only first form populated
- ❌ Script error on multiple forms

---

### Test 14: Dynamic/AJAX Form Loading

**Objective:** Verify MutationObserver detects late-loaded forms

**Steps:**
1. Create page where form loads 2 seconds after page load (via JavaScript)
2. Visit with UTM parameters
3. Wait for form to appear
4. Inspect hidden fields

**Expected Result:**
- ✅ Console: "New form detected, populating fields"
- ✅ Late-loaded form has UTM fields populated
- ✅ Form submits correctly

**Fail Criteria:**
- ❌ Late-loaded form fields empty
- ❌ MutationObserver not working

---

### Test 15: UTM Override (New Campaign)

**Objective:** Verify new UTM params override old cookies

**Steps:**
1. Visit with Campaign A:
   ```
   https://client-site.com?utm_source=facebook&utm_campaign=winter
   ```
2. Later, visit with Campaign B:
   ```
   https://client-site.com?utm_source=google&utm_campaign=summer
   ```
3. Check cookies and form fields

**Expected Result:**
- ✅ Cookies updated to Campaign B values
- ✅ Form fields show Campaign B
- ✅ Attribution: Last-touch (most recent campaign)

**Alternative behavior (First-touch):**
If you want first-touch attribution, modify tracker.js to NOT overwrite existing cookies.

**Fail Criteria:**
- ❌ Cookies not updated (stuck on Campaign A)
- ❌ Conflicting values in fields

---

## Browser Compatibility Testing

### Test 16: Cross-Browser Validation

**Objective:** Verify tracker works on all major browsers

**Test on:**
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

**For each browser:**
1. Load page with UTM
2. Check console (no errors)
3. Inspect cookies/localStorage
4. Submit form

**Expected Result:**
- ✅ All browsers: Script loads, cookies set, forms populate

**Fail Criteria:**
- ❌ Any browser: Console error
- ❌ Safari: Cookies blocked by ITP (use localStorage fallback)

---

### Test 17: Ad Blocker Compatibility

**Objective:** Verify tracker works with ad blockers

**Steps:**
1. Install uBlock Origin or AdBlock Plus
2. Visit landing page with UTM
3. Check if script loads

**Expected Result:**
- ✅ Script loads (first-party CDN not blocked)
- ✅ Cookies set
- ✅ Form fields populated

**Common issue:**
- ⚠️ If blocked, consider self-hosting on client domain

**Fail Criteria:**
- ❌ Script blocked by ad blocker
- ❌ Functionality broken

---

## Production Monitoring

### Test 18: CDN Availability Check

**Objective:** Verify jsDelivr CDN is serving script

**Steps:**
1. Visit CDN URL directly in browser:
   ```
   https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js
   ```
2. Check response

**Expected Result:**
- ✅ Status: 200 OK
- ✅ Content-Type: `application/javascript`
- ✅ Script content visible
- ✅ No 404 or errors

**Fail Criteria:**
- ❌ 404 Not Found (repo not public or wrong URL)
- ❌ Empty response

---

### Test 19: Cache Invalidation (After Update)

**Objective:** Verify CDN cache refreshes after git push

**Steps:**
1. Make change to tracker.js locally (add console.log)
2. Git commit + tag + push
3. Wait 5-10 minutes
4. Visit CDN URL in incognito mode
5. Check if new version served

**Expected Result:**
- ✅ After 5-10 min: New version visible at CDN URL
- ✅ Clients reload page → new script loaded

**Fail Criteria:**
- ❌ Old version still cached after 30 min
- ❌ New version not deployed

---

## Automated Testing Script (Optional)

### JavaScript Test Suite

```javascript
// utm-tracker-test.js
// Run in browser console for quick validation

(function() {
  const tests = [];

  // Test 1: Script loaded
  tests.push({
    name: 'Script loaded',
    pass: typeof window.JPSUTMTracker !== 'undefined'
  });

  // Test 2: Version check
  tests.push({
    name: 'Version 1.0.0',
    pass: window.JPSUTMTracker.version === '1.0.0'
  });

  // Test 3: UTM data captured
  const utmData = window.JPSUTMTracker.getUTMData();
  tests.push({
    name: 'UTM data exists',
    pass: Object.keys(utmData).length > 0
  });

  // Test 4: Cookies set
  const hasCookies = document.cookie.includes('utm_source');
  tests.push({
    name: 'Cookies set',
    pass: hasCookies
  });

  // Test 5: Form fields populated
  const fields = document.querySelectorAll('input[name^="utm_"]');
  const fieldsPopulated = Array.from(fields).some(f => f.value !== '');
  tests.push({
    name: 'Form fields populated',
    pass: fieldsPopulated
  });

  // Print results
  console.log('=== UTM Tracker Test Results ===');
  tests.forEach(t => {
    console.log(`${t.pass ? '✅' : '❌'} ${t.name}`);
  });

  const passed = tests.filter(t => t.pass).length;
  console.log(`\nPassed: ${passed}/${tests.length}`);

  return tests.every(t => t.pass) ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED';
})();
```

**Usage:**
1. Visit page with UTM parameters
2. Paste script in console
3. Check results

---

## Test Summary Checklist

### Pre-Deployment
- [ ] Script loads without errors (Test 1)
- [ ] UTM captured from URL (Test 2)
- [ ] Cookies set correctly (Test 3)
- [ ] localStorage fallback works (Test 4)
- [ ] Hidden fields populated (Test 5)
- [ ] GHL contact receives data (Test 6)
- [ ] Webhook to Supabase works (Test 7)

### Multi-Page
- [ ] Cookies persist across pages (Test 8)
- [ ] 30-day attribution window (Test 9)

### Edge Cases
- [ ] Organic traffic (no UTM) works (Test 10)
- [ ] Partial UTM handled (Test 11)
- [ ] Special characters work (Test 12)
- [ ] Multiple forms populated (Test 13)
- [ ] Dynamic forms detected (Test 14)
- [ ] UTM override works (Test 15)

### Browser Compatibility
- [ ] Chrome works (Test 16)
- [ ] Firefox works (Test 16)
- [ ] Safari works (Test 16)
- [ ] Mobile browsers work (Test 16)
- [ ] Ad blockers compatible (Test 17)

### Production
- [ ] CDN serving correctly (Test 18)
- [ ] Cache invalidation works (Test 19)

---

## When Tests Fail

### Debug Checklist

1. **Enable debug mode:**
   ```javascript
   JPSUTMTracker.debug(true);
   ```

2. **Check console for errors**

3. **Verify script loaded:**
   ```javascript
   typeof JPSUTMTracker
   ```

4. **Check UTM data:**
   ```javascript
   JPSUTMTracker.getUTMData()
   ```

5. **Manually refresh fields:**
   ```javascript
   JPSUTMTracker.refresh()
   ```

6. **Check cookies:**
   ```javascript
   document.cookie
   ```

7. **Check localStorage:**
   ```javascript
   localStorage
   ```

### Common Fixes

| Problem | Fix |
|---------|-----|
| Script not loading | Check CDN URL, GitHub repo public |
| Cookies not setting | Check GDPR config, browser settings |
| Fields not populating | Check Field Key matches exactly |
| Multi-page not working | Add tracking code to all pages |
| Console errors | Check browser compatibility |

---

**Last updated:** 2025-12-24
**Version:** 1.0.0
