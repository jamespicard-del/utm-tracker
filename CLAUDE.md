# CLAUDE.md - JPS UTM Attribution Tracker

**Rôle:** Tracking script production-ready pour attribution marketing (client onboarding)

---

## Mission du Projet

**utm-tracker** = Script JavaScript léger pour capturer UTM parameters + click IDs (fbclid, gclid) et auto-populate GoHighLevel form fields.

**Cas d'usage:** Tout client JPS utilisant GHL pour tracking attribution marketing

**Architecture:**
- Vanilla JavaScript (zero dependencies)
- jsdelivr CDN (global, stable, auto-updates)
- Cookie + localStorage persistence (30 days)
- GDPR-ready (cookie consent checks)

---

## Démarrage Rapide

**Premier reflexe:**
1. Lire la dernière session: `archive/sessions/SESSION-XX.md` (fichier avec le plus grand numéro)
2. Lire le README.md
3. Lire les guides documentation dans `docs/`

**Documents critiques:**
1. `archive/sessions/SESSION-XX.md` - Contexte dernière session
2. `README.md` - Overview + quick start
3. `docs/QUICKREF.md` - Cheatsheet condensé (client-ready)
4. `docs/INSTALLATION.md` - GHL setup step-by-step
5. `docs/FACEBOOK-SETUP.md` - Facebook Ads UTM template
6. `docs/GOOGLE-ADS-SETUP.md` - Google Ads tracking template

---

## État Productionnel

**Version Courante:** v1.1.0 ✅

**Features Complètes:**
- ✅ UTM capture (source, medium, campaign, term, content)
- ✅ fbclid capture (Facebook Click ID)
- ✅ gclid capture (Google Click ID)
- ✅ Cookie persistence (30 days)
- ✅ localStorage fallback
- ✅ Multi-page tracking
- ✅ GDPR-ready
- ✅ Error handling + debug logging
- ✅ SPA support (dynamic form detection)
- ✅ Guard anti-doublon (if script loaded multiple times)

**CDN:** jsdelivr (production-stable)
```
https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js
```

**Client Onboarding:**
- Documentation complète dans `docs/`
- QUICKREF.md prêt à imprimer (2 pages)
- Installation guide avec screenshots (TBD)
- Setup time: ~15 min pour GHL

---

## Custom Fields (GHL)

**7 champs à créer (Forms → Custom Fields → Hidden):**

| Field Name | Type | Field Key (EXACT - case-sensitive) |
|------------|------|-----|
| UTM Source | Hidden | `utm_source` |
| UTM Medium | Hidden | `utm_medium` |
| UTM Campaign | Hidden | `utm_campaign` |
| UTM Term | Hidden | `utm_term` |
| UTM Content | Hidden | `utm_content` |
| Facebook Click ID | Hidden | `fbclid` |
| Google Click ID | Hidden | `gclid` |

**CRITICAL:** Field Key doit matcher EXACTEMENT (case-sensitive)

---

## Architecture Decision: IDs vs Names

**Pattern utilisé:** Campaign/Adset/Ad IDs (NOT names)

**Raison:**
1. **Immutabilité:** IDs ne changent jamais, noms peuvent être renommés
2. **Data Quality:** Renommer campagne = nouvellerows dans analytics (bad)
3. **Grain Design:** GROUP BY IDs uniquement (prevents duplicates)
4. **Dashboard:** Drill-down stable sur IDs immuables

**Exemple (Facebook):**
```
✅ GOOD:  utm_campaign={{campaign.id}}&utm_content={{ad.id}}&utm_term={{adset.id}}
❌ WRONG: utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

**Conversion Tracking:**
- **fbclid:** Facebook automatically appends (Ads Manager) → captures para conversion tracking
- **gclid:** Google appends with auto-tagging → Google conversion tracking

---

## Version History

- **v1.1.0** (2025-12-24): fbclid + gclid capture + guard anti-doublon
- **v1.0.2** (2025-12-24): Guard anti-doublon si script chargé plusieurs fois
- **v1.0.1** (2025-12-24): GoHighLevel data-q attribute support
- **v1.0.0** (2025-12-24): Initial production release

**Tag v1:** Points à latest stable (v1.1.0)

---

## Session Protocol

**Ouverture:**
1. Lister `archive/sessions/` et lire SESSION-XX.md le plus récent
2. Vérifier version courante dans v1/tracker.js
3. Identifier prochaine tâche d'EXÉCUTION

**Fermeture (4 questions):**
1. Quelle tâche SPÉCIFIQUE ensuite?
2. Date et heure EXACTE?
3. Quelle preuve? (commits, tags, files)
4. Que faire si deadline manquée?

**Archivage:**
- Créer `archive/sessions/SESSION-XX.md` avec détails complets
- Inclure commits + tags + key decisions
- Lister prochaines actions (lead time estimé)

---

## Règles Workspace

**JAMAIS:**
- Modifier v1/tracker.js sans test local d'abord
- Deployer sur main sans test sur landing page
- Créer version sans tag correspondant

**TOUJOURS:**
- Test sur landing page RÉELLE avant deploy
- Update CHANGELOG.md avec chaque version
- Tag version sur main branch
- Commit SESSION-XX.md après session

**CDN Cache:**
- jsdelivr cache ~30 min
- Force refresh: `https://cdn.jsdelivr.net/gh/.../tracker.js?v=1.1.0`
- Purge URL en dev: `https://purge.jsdelivr.net`

---

## Ton et Approche

**Execution > Perfection.**

- "L'as-tu testé sur landing page réelle? Oui ou non."
- "Show me the proof: commit hash + CDN URL working."
- "Client ready? Oui = ship. Non = fix."

**YAGNI (You Aren't Gonna Need It):**
- Attribution models (Last Click, Multi-Touch) = FUTURE
- Advanced reporting = FUTURE
- Focus: Simple, working tracker pour client onboarding

---

## Ressources Clés

| Besoin | Fichier |
|--------|---------|
| Dernière session | `archive/sessions/SESSION-XX.md` (le plus récent) |
| Version courante | `v1/tracker.js` |
| Quick ref client | `docs/QUICKREF.md` |
| GHL setup | `docs/INSTALLATION.md` |
| Facebook setup | `docs/FACEBOOK-SETUP.md` |
| Google setup | `docs/GOOGLE-ADS-SETUP.md` |
| Changelog | `CHANGELOG.md` |

---

## Next Session

**Prochaine action:** SOP Complet Client Onboarding

**Livrables:**
1. SOP checklist (GHL setup + testing + go-live)
2. Email template intro pour client
3. Video tutoriel (optional)
4. Client handoff package (zipfile)

**Lead Time:** ~2h

**Why Next:**
- Tracker est 100% feature-complete
- Besoin process repeatable pour scale client onboarding
- SOP = automation + consistency

---

## Statistiques Projet

### Session #110 (2025-12-24 - ~1h) - DEBUG & CLICK ID CAPTURE (COMPLETE)
- **Status:** ✅ COMPLETE (fbclid/gclid capture, double script resolved, 4 docs created)
- **Accomplissements:** Résolu double script issue (raw.githubusercontent vs jsdelivr), fbclid capture, gclid capture, guard anti-doublon, 4 guides (QUICKREF, INSTALLATION, FACEBOOK-SETUP, GOOGLE-ADS-SETUP)
- **Highlights:** raw.githubusercontent MIME type issue found (text/plain ≠ application/javascript), jsdelivr correct. Click ID capture unlocks Facebook/Google conversion tracking. QUICKREF ready to print (2 pages).
- **Key Metrics:** 100% sprint complete (1/1h), v1.1.0 deployed, production-ready, documentation client-ready

---

*Dernière mise à jour: 2025-12-24 (Session #110 COMPLETE - Debug & Click ID Capture)*
