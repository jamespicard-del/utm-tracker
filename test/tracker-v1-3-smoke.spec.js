import { test, expect } from '@playwright/test';

/**
 * Phase 92 Wave 3 — Tracker v1.3 smoke test on JPM VSL 1.
 *
 * Validates that tracker.js v1.3.0 loaded from track.jpmetrix.com/v1/tracker.js
 * works correctly when injected into a real GHL funnel page.
 *
 * Side effects: visits go.jpmetrix.com/vsl-1, fires 1+ beacons (will 404
 * silently until Phase 93 ships the Edge Function). Does NOT submit any form.
 *
 * NOTE on form_view/form_start: VSL 1's calendar widget is iframe-embedded
 * (GHL's leadconnectorhq.com/msgsndr.com). Our tracker runs on the parent
 * (go.jpmetrix.com) which has no <form> elements in its own DOM. Per
 * CONTEXT.md D-14..D-17, form events from iframe-only forms are not
 * captured on VSL 1 — this is expected behavior, not a regression.
 * Test future client funnels with same-document forms (e.g. LD opt-in
 * page) to validate form_view/form_start firing.
 */

const VSL_URL = 'https://go.jpmetrix.com/vsl-1?utm_source=playwright_smoke&utm_medium=test&utm_campaign=v1_3_validation&utm_content=phase92&utm_term=smoke&fbclid=playwright_fbclid&gclid=playwright_gclid';

test('Phase 92 — tracker v1.3 smoke on JPM VSL 1', async ({ page, context }) => {
  const beacons = [];

  // page.route captures sendBeacon Blob bodies (which standard request handler can't)
  await page.route('**/api/beacon', async (route, request) => {
    let payload;
    try {
      const buf = request.postDataBuffer();
      if (buf) payload = JSON.parse(buf.toString('utf-8'));
    } catch (e) {
      try { payload = JSON.parse(request.postData() || '{}'); } catch { payload = request.postData(); }
    }
    beacons.push({ url: request.url(), payload });
    await route.continue();
  });

  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.on('console', msg => msg.type() === 'error' && consoleErrors.push(msg.text()));

  await page.goto(VSL_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // CHECK 1 — tracker v1.3.0 loaded
  const trackerVersion = await page.evaluate(() => window.JPSUTMTracker?.version);
  expect(trackerVersion, 'tracker.js v1.3.0 served from track.jpmetrix.com/v1/').toBe('1.3.0');

  // CHECK 2 — UID cookie + localStorage in sync, no double-prefix bug
  const cookies = await context.cookies();
  const uidCookie = cookies.find(c => c.name === 'jps_uid');
  expect(uidCookie?.value, 'jps_uid cookie set with UUID v4').toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
  const lsState = await page.evaluate(() => ({
    uid: localStorage.getItem('jps_utm_uid'),
    doubleBuggy: localStorage.getItem('jps_utm_jps_uid'),
  }));
  expect(lsState.uid, 'localStorage jps_utm_uid matches cookie (D-23 correct prefix)').toBe(uidCookie.value);
  expect(lsState.doubleBuggy, 'jps_utm_jps_uid double-prefix bug absent').toBeNull();

  // CHECK 3 — pageview beacon fired with full payload
  const pageviewBeacon = beacons.find(b => b.payload?.event === 'pageview' && !b.payload?.extras?.test);
  expect(pageviewBeacon, 'pageview beacon fired during init').toBeDefined();
  expect(pageviewBeacon.payload.uid).toBe(uidCookie.value);
  expect(pageviewBeacon.payload.utm.source).toBe('playwright_smoke');
  expect(pageviewBeacon.payload.utm.medium).toBe('test');
  expect(pageviewBeacon.payload.utm.campaign).toBe('v1_3_validation');
  expect(pageviewBeacon.payload.click_ids.fbclid).toBe('playwright_fbclid');
  expect(pageviewBeacon.payload.click_ids.gclid).toBe('playwright_gclid');
  expect(pageviewBeacon.payload.v).toBe('1.3.0');
  expect(pageviewBeacon.payload.account_slug, 'VSL 1 has no data-account, slug should be null').toBeNull();

  // CHECK 4/5 — form_view + form_start: INFORMATIONAL on VSL 1
  // VSL 1's booking calendar is iframe-embedded → parent's tracker can't observe iframe forms.
  // We document the finding but do NOT assert (would need a same-document form funnel to assert).
  console.log(`\n  [INFO] VSL 1 iframe form architecture — form_view/form_start expected NOT to fire here.`);
  console.log(`         Total beacons captured: ${beacons.length}`);
  beacons.forEach(b => {
    console.log(`           - event=${b.payload?.event || '?'} form_id=${b.payload?.form_id || 'n/a'}`);
  });

  // CHECK 6 — window.JPSUTMTracker namespace
  const namespace = await page.evaluate(() => ({
    version: window.JPSUTMTracker.version,
    uid: window.JPSUTMTracker.uid,
    account: window.JPSUTMTracker.account,
    flushBeaconType: typeof window.JPSUTMTracker.flushBeacon,
  }));
  expect(namespace.version).toBe('1.3.0');
  expect(namespace.uid).toBe(uidCookie.value);
  expect(namespace.account, 'VSL 1 has no data-account attribute → null').toBeNull();
  expect(namespace.flushBeaconType).toBe('function');

  // CHECK 7 — UTM cookies in localStorage (NOT cookies — v1.2 design)
  const utmStorage = await page.evaluate(() => {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
    const out = {};
    keys.forEach(k => out[k] = localStorage.getItem('jps_utm_' + k));
    return out;
  });
  expect(utmStorage.utm_source, 'jps_utm_utm_source in localStorage').toBe('playwright_smoke');
  expect(utmStorage.utm_medium).toBe('test');
  expect(utmStorage.utm_campaign).toBe('v1_3_validation');
  expect(utmStorage.fbclid).toBe('playwright_fbclid');
  expect(utmStorage.gclid).toBe('playwright_gclid');

  // CHECK 8 — no tracker-emitted console errors
  const trackerErrors = consoleErrors.filter(e => /UTM Tracker|JPSUTMTracker|UTM BCN|\bUTM\]/i.test(e));
  expect(trackerErrors, 'no tracker.js console errors').toEqual([]);
});
