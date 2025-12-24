# SESSION-110: UTM Tracker Debug & Facebook/Google Click ID Capture

**Date:** 2025-12-24
**Durée:** ~1h
**Project:** utm-tracker (attribution marketing)
**Status:** COMPLETE

---

## 🎯 Objectif Session

Debug et améliorer le tracker UTM pour attribution marketing:
1. Identifier et corriger problèmes tracking script (double scripts, CDN issues)
2. Ajouter capture fbclid (Facebook Click ID) et gclid (Google Click ID)
3. Créer documentation client pour déploiement

---

## 🔍 Problèmes Trouvés & Résolus

### Problème 1: Double Script Tracker

**Symptôme:** Script chargé 2 fois (raw.githubusercontent + jsdelivr)

**Root Cause:**
- GHL Settings a 2 sections: "Page-Level" ET "Funnel-Level"
- Page-Level avait raw.githubusercontent
- Funnel-Level avait jsdelivr
- Résultat: 2 scripts chargés = state conflicts + inefficace

**Résolution:**
- Supprimé raw.githubusercontent (Page-Level)
- Gardé SEULEMENT jsdelivr (Funnel-Level) comme CDN principal
- Testé: ✅ Single script load confirmé

### Problème 2: raw.githubusercontent ne Fonctionne pas comme CDN

**Symptôme:** Script non-exécuté, console erreurs

**Root Cause:**
- raw.githubusercontent envoie `Content-Type: text/plain` (PAS `application/javascript`)
- Browser refuse d'exécuter script avec MIME type invalide (security policy)
- jsdelivr envoie correct `Content-Type: application/javascript` ✅

**Résolution:**
- Remplacé tous les scripts par jsdelivr CDN
- Purgé cache jsdelivr (`?v=1.1.0` dans URL)
- Vérifié header MIME correct

---

## ✨ Améliorations Déployées

### v1.1.0: Facebook & Google Click ID Capture

**Code changé:**
```javascript
// Capture fbclid (Facebook) et gclid (Google)
const fbclid = params.get('fbclid');
const gclid = params.get('gclid');

if (fbclid) utmData.fbclid = fbclid;
if (gclid) utmData.gclid = gclid;
```

**Bénéfices:**
- Facebook: `fbclid` automatique dans URLs (Facebook Ads Manager)
- Google: `gclid` avec auto-tagging Google Ads
- Supabase reçoit IDs directement → attribution précise

**Field Types (GHL Custom Fields):**
- `fbclid` (Hidden) - Facebook Click ID
- `gclid` (Hidden) - Google Click ID

### v1.0.2: Guard Anti-Doublon

**Code ajouté:**
```javascript
// Éviter doublon instance si script chargé plusieurs fois
if (window.JPSUTMTracker !== undefined) {
  console.warn('UTM Tracker déjà chargé, skipping initialization');
  return;
}
```

**Protège contre:**
- Multiple script loads
- Accidental reinitialisation
- State collision

---

## 📋 Documentation Créée

### docs/QUICKREF.md
Ultra-condensé (2 pages):
- 8 sections clés
- Installation code exact
- Custom fields mapping (table)
- Facebook/Google UTM templates
- Quick test procedure
- Troubleshooting court
- "How it Works" 30-second version

**Usage:** Imprimer + donner client pour setup rapide (15 min)

### docs/INSTALLATION.md
Step-by-step GHL setup:
- Where to install tracking code
- Custom fields creation (7 champs)
- Form field mapping
- Testing procedure

### docs/FACEBOOK-SETUP.md
Facebook Ads UTM template:
- Exact URL parameters
- Why use IDs not names
- Screenshots (TBD)

### docs/GOOGLE-ADS-SETUP.md
Google Ads tracking template:
- Campaign settings
- Auto-tagging config
- Tracking template exact
- Why IDs not names

---

## 📊 Commits

**Commit 1:**
```
feat: Add fbclid/gclid capture for conversion tracking (v1.1.0)
- Facebook Click ID (fbclid) auto-capture
- Google Click ID (gclid) auto-capture
- Guard anti-doublon si script chargé plusieurs fois
```

**Commit 2:**
```
docs: Add documentation guides (INSTALLATION, FACEBOOK-SETUP, GOOGLE-ADS-SETUP)
- GHL installation step-by-step
- Facebook Ads URL parameter template
- Google Ads tracking template
- Updated README with doc links
```

**Tag Update:**
- `v1` → Pointe maintenant à `v1.1.0` (fbclid + gclid)
- `v1.0.2` → Garde la version avec guard anti-doublon

---

## 📈 État Final du Projet

**Version Productionelle:** v1.1.0 ✅

**Capture Complète:**
- ✅ utm_source
- ✅ utm_medium
- ✅ utm_campaign
- ✅ utm_term
- ✅ utm_content
- ✅ fbclid (NEW)
- ✅ gclid (NEW)

**CDN:** jsdelivr (stable, correct MIME type)

**Documentation:**
- ✅ QUICKREF.md (2 pages, client-ready)
- ✅ INSTALLATION.md (detailed)
- ✅ FACEBOOK-SETUP.md (template)
- ✅ GOOGLE-ADS-SETUP.md (template)

**Prêt pour client onboarding** ✅

---

## 🎯 Next Session (#111)

**Objectif:** SOP Complet Client Onboarding

**Livrables:**
1. **SOP Onboarding Complet**
   - Checklist GHL setup (8 étapes)
   - Testing checklist (5 tests)
   - Troubleshooting guide (3-5 scenarios)
   - Go-live checklist

2. **Video Tutoriel (Optional)**
   - 10-minute GHL setup walkthrough
   - Test procedure demo
   - Common mistakes à éviter

3. **Client Handoff Package**
   - Zipfile: docs/ + QUICKREF.md + Onboarding SOP
   - Email template intro
   - Support escalation process

**Lead Time:** ~2h pour SOP complet

**Why Next:**
- Tracker est 100% functionalité-complet
- Besoin documentation procédure pour scale client onboarding
- SOP = repeatable process for future clients

---

## 📋 Notes Techniques

### Pourquoi fbclid ET gclid?

**Facebook:**
- Ajoute automatiquement `fbclid` à URLs (Ads Manager)
- Chaîne hexadécimale unique par click
- Permet Facebook retargeting + conversion tracking

**Google:**
- Ajoute `gclid` avec auto-tagging activé
- Permet Google conversion tracking + attribution
- Plus fiable que UTMs pour Google ads

**Impact Supabase:**
- Deux colonnes separées (fbclid, gclid)
- Permet cross-matching avec APIs Facebook/Google
- Better attribution accuracy vs UTMs seuls

### Grain Design Decision

**Approche immutable IDs:**
```javascript
utm_campaign={{campaign.id}}      // NOT {{campaign.name}}
utm_content={{ad.id}}             // NOT {{ad.name}}
utm_term={{adset.id}}             // NOT {{adset.name}}
```

**Raison:**
1. IDs ne changent JAMAIS
2. Noms renommés = nouvelles lignes analytics (bad)
3. Immutabilité = data quality meilleure
4. Essential pour drill-down accurate dans dashboards

---

## ✅ Quality Checklist

- [x] Double script issue trouvé et résolu
- [x] raw.githubusercontent remplacé par jsdelivr
- [x] fbclid capture implémentée
- [x] gclid capture implémentée
- [x] Guard anti-doublon ajouté
- [x] QUICKREF.md créé (client-ready)
- [x] Installation guide créé
- [x] Facebook setup guide créé
- [x] Google setup guide créé
- [x] README.md updated avec doc links
- [x] v1.1.0 tagged
- [x] Commits créés
- [x] Production-ready confirmé

---

**Prêt pour:** Client onboarding production

**Lead Time Session #111:** ~2h (SOP onboarding complet)

**Proof:**
- Commits: feat: Add fbclid/gclid capture (v1.1.0)
- Tag: v1 (pointe à v1.1.0)
- Docs: 4 guides créés
- README: Updated avec doc links
