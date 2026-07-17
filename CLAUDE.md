# CLAUDE.md — JPS UTM Attribution Tracker (index durable)

**Rôle :** Script JS production-ready d'attribution marketing (UTM + click IDs → GoHighLevel) pour l'onboarding client JPS.

> 🚨 **AVERTISSEMENT (2026-07-16) — LE CODE DE CE REPO N'EST PAS CELUI DE LA PROD.**
> `v1/tracker.js` ici = **v1.3.0**. La prod (`track.jpmetrix.com`) sert **v1.6.4**, depuis le repo
> **`jamespicard-del/jpmetrix-cdn`**. Les versions v1.4→v1.6.4 y ont été committées directement,
> contournant le pipeline `tag → publish-cdn.yml`. **Coder sur ce repo = régresser la prod de 6 versions.**
> Le diagnostic complet + le call à trancher → **`CONTEXT.md` §LIS ÇA**. Tout ce qui suit décrit le
> DESIGN durable ; les faits marqués ⚠️ ont dérivé dans la version live.

> 🚪 **OÙ ON EN EST → `CONTEXT.md`** (version courante, goulot, next). Ce CLAUDE.md = index durable : mission, architecture, config GHL, règles. Version history → `CHANGELOG.md` (⚠️ s'arrête à v1.3.0).

---

## 🎯 Mission
Script **vanilla JS** (zéro dépendance) qui capture UTM params + fbclid/gclid et auto-remplit les champs GHL. Cas d'usage : tout client JPS utilisant GHL pour l'attribution.

## 🏗️ Architecture (durable)
- Vanilla JS · persistence cookie + localStorage (30 j) · GDPR-ready (cookie consent) · SPA support (MutationObserver) · guard anti-doublon.
- **Iframe passthrough (v1.2+) :** le script patche le `src` des iframes GHL détectées avec les UTMs/click IDs stockés → un form GHL **embeddé en iframe sur un site externe reçoit quand même l'attribution**. Multi-host GHL natif (`leadconnectorhq.com`, `msgsndr.com`, `gohighlevel.com`) + `data-iframe-host="..."` sur le `<script>` pour un domaine whitelabel custom. → installer le script sur la **page hôte**, pas dans l'iframe. Détail → `CHANGELOG.md §1.2.0`.
- **UID + beacons comportementaux (v1.3+) :** cookie UID (UUID v4, 30j) + 3 beacons `sendBeacon` (`pageview`/`form_view`/`form_start`) → `track.jpmetrix.com/api/beacon`, consommés par JPS_produit (touches). Attribut `data-account="<slug-client>"` sur le `<script>` tag = standard d'install (identifie le compte dans les beacons). Relais postMessage iframe→parent. Détail → `CHANGELOG.md §1.3.0`.
  > ⚠️ **RENOMMAGES en v1.4 — ce repo dit encore `jps_*` partout, la prod est en `jpm_*`** (vérifié dans le code v1.6.4) :
  > cookie UID `jps_uid` → **`jpm_uid`** · storage prefix `jps_utm_` → **`jpm_utm_`** · postMessage `jps-beacon` → **`jpm-beacon`**.
- ⚠️ **Ce que la prod fait EN PLUS et qui n'est décrit nulle part ici** (v1.5→v1.6.4, code dans `jpmetrix-cdn`) :
  injection `?jpm_uid=` via `history.replaceState` · `setReactiveValue()` pour les forms Vue de GHL ·
  détection des forms modernes `<div id="_builder-form">` · capture `_fbc`/`_fbp` du Pixel FB pour la dédup CAPI.
- **Décision IDs vs names** (campaign/adset/ad = **IDs**, jamais names) : immutabilité → pas de doublons analytics au renommage. Rationale → `CONTEXT.md §DÉCISIONS`.

## ⚙️ Config GHL — custom fields (Hidden, Field Key EXACT, case-sensitive)
**Décrits par ce repo (v1.3) — 7 :** `utm_source` · `utm_medium` · `utm_campaign` · `utm_term` · `utm_content` · `fbclid` · `gclid`
**⚠️ Ce que la prod v1.6.4 remplit réellement — 10** (lu dans son `CONFIG`) : les 7 ci-dessus **+ `jpm_uid`** (v1.4, le cookie UID sert aussi de nom de hidden field) **+ `fbc` + `fbp`** (v1.6.2, cookies du Pixel FB pour la dédup CAPI).
> ⚠️ Field Key doit matcher EXACTEMENT (case-sensitive) sinon la capture est perdue **en silence** — c'est le mode d'échec par défaut de ce système : rien ne casse, la donnée manque juste.

**CDN prod :** `https://track.jpmetrix.com/v1/tracker.js` ← servi par le repo **`jpmetrix-cdn`** (Vercel, domaine attaché au projet).
- Résolution : `/v1/` = plus haut minor.patch (cache 300 s) · `/v1.6.4/` = exact, immutable (1 an) · `/latest/`.
- `/api/beacon` y est réécrit vers la fonction Supabase `events` (cf. `vercel.json` du CDN).
- ⚠️ **jsdelivr n'est PAS le chemin de prod** (`@v1` y sert encore **v1.1.0**, mesuré 2026-07-16). Toute doc de ce repo pointant jsdelivr comme CDN client est **périmée**.

## 🚧 Règles workspace
**JAMAIS :** modifier `v1/tracker.js` sans test local · deploy sans test sur landing page réelle · créer une version sans tag.
**TOUJOURS :** test landing réelle avant deploy · update `CHANGELOG.md` · tag version sur main.
> 🔴 **Ces 3 règles ont été violées de v1.4 à v1.6.4** (aucun tag, aucune entrée CHANGELOG, code committé direct dans le CDN). Elles n'étaient forcées par rien. **Avant de coder ici, vérifie ce que la prod sert :**
> ```bash
> curl -s https://track.jpmetrix.com/v1/tracker.js | grep -m1 "version: '"
> ```
> Si ça ne matche pas `v1/tracker.js` local → **STOP**, lis `CONTEXT.md §LIS ÇA`. Le fichier ment, pas la prod.

## 🗺️ Ressources
| Besoin | Fichier |
|---|---|
| Le script | `v1/tracker.js` |
| Quick ref client | `docs/QUICKREF.md` |
| Setup GHL / FB / Google | `docs/INSTALLATION.md` · `docs/FACEBOOK-SETUP.md` · `docs/GOOGLE-ADS-SETUP.md` |
| Version history | `CHANGELOG.md` |
| Sessions | `archive/sessions/SESSION-XX.md` |

## 🗂️ Session protocol
- **Ouverture :** `CONTEXT.md` + dernière session + version dans `v1/tracker.js`.
- **Fermeture :** agent universel `session-reset`. **Git :** oui (repo actif).
- Standard : `OS/.claude/rules/project-structure-standard.md`.

## Ton
Execution > perfection. « Testé sur landing réelle ? commit hash + CDN URL ? » YAGNI : attribution models / advanced reporting = future, pas maintenant.

---

**Document vivant (index durable)** | Refonte split durable/vivant : 2026-06-17 (état + version history + logs migrés → `CONTEXT.md` / `CHANGELOG.md`). | Révision : chaque saison.
