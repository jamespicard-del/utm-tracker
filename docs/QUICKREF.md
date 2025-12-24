# UTM Tracker Quick Reference

## 1. Installation Code

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>
```

**Replace `YOUR-USERNAME` with your GitHub username**

---

## 2. Where to Install (GHL)

**Settings → Tracking Code** (header section, loads on all pages)

---

## 3. Custom Fields to Create (GHL)

**Forms → Custom Fields → Add 7 Hidden Fields:**

| Field Name | Type | Field Key (EXACT) |
|------------|------|-------------------|
| UTM Source | Hidden | `utm_source` |
| UTM Medium | Hidden | `utm_medium` |
| UTM Campaign | Hidden | `utm_campaign` |
| UTM Term | Hidden | `utm_term` |
| UTM Content | Hidden | `utm_content` |
| Facebook Click ID | Hidden | `fbclid` |
| Google Click ID | Hidden | `gclid` |

**CRITICAL:** Field Key must match EXACTLY (case-sensitive)

---

## 4. Facebook Ads UTM Template

**Use in Facebook Ads Manager → URL Parameters:**

```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.id}}&utm_content={{ad.id}}&utm_term={{adset.id}}
```

**Note:** Facebook automatically adds `fbclid` to URLs (no need to include)

**Why IDs not names:**
- IDs never change (immutable)
- Names can be renamed (breaks tracking)
- Better data quality for analytics

---

## 5. Google Ads UTM Template

**Use in Google Ads → Campaign Settings → Campaign URL options → Tracking template:**

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={adgroupid}
```

**Note:** Google automatically adds `gclid` when auto-tagging is enabled

**Enable auto-tagging:** Account Settings → Auto-tagging → Enable

**Why IDs not names:**
- Same reason as Facebook (immutability)
- Prevents duplicate rows on campaign rename

---

## 6. Quick Test

### Step 1: Visit URL with UTM params

```
https://your-landing-page.com?utm_source=facebook&utm_campaign=test&utm_medium=paid
```

### Step 2: Open browser console and run

```javascript
JPSUTMTracker.debug(true);
JPSUTMTracker.getUTMData();
```

**Expected output:**
```javascript
{
  utm_source: "facebook",
  utm_medium: "paid",
  utm_campaign: "test"
}
```

### Step 3: Submit form and verify in GHL

**GHL Contact → Custom Fields → Check UTM fields are populated**

---

## 7. Troubleshooting

**UTMs not captured?**
- Check URL has `?utm_source=...` (not missing `?`)
- Enable debug: `JPSUTMTracker.debug(true);`
- Check browser console for errors

**Fields not populated?**
- Field Key MUST match exactly: `utm_source` (not `UTM_Source`)
- Field type must be Hidden or Text
- Check field exists in form (not just global custom field)

**Multi-page not working?**
- Tracking code must be on ALL pages
- Check cookies enabled in browser
- Domain must be consistent (cookies are domain-specific)

---

## 8. How It Works (30-second version)

1. User clicks ad → Lands on site with `?utm_source=facebook`
2. Script captures UTM → Saves to cookie (30 days)
3. User navigates pages (UTM persists in cookie)
4. User submits form → Hidden fields auto-populated
5. GHL webhook fires → UTM data included
6. Supabase receives data → Attribution complete

**Cookie persistence = Multi-page tracking**

---

**Production-ready** | **Zero dependencies** | **$0 cost** | **15 min setup**
