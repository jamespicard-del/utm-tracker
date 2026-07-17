# 📍 CONTEXT — utm-tracker (état vivant)

> **Horloge RAPIDE.** Repo applicatif (code). État + goulot + next. Le durable (mission, architecture, custom fields, règles) → `CLAUDE.md`. La donnée de référence (docs setup) reste dans `docs/`.

**Dernière mise à jour :** 2026-07-16 — 🔴 **RÉPARATION MAJEURE : ce repo n'est plus la source de ce qui tourne en prod.** Il affirmait « v1.3.0 production-stable » ; la prod sert **v1.6.4** depuis `jpmetrix-cdn`. Détail ci-dessous. *(2ᵉ dérive de version sur ce même fichier : la 1ʳᵉ, réparée le 2026-07-13, disait v1.1.0 alors que v1.3.0 était live.)*

---

## 🔴 LIS ÇA AVANT DE TOUCHER À `v1/tracker.js`

**Le `v1/tracker.js` de ce repo est PÉRIMÉ DE 6 VERSIONS. Coder dessus = faire régresser la prod.**

| | Ce repo (`utm-tracker`) | Ce que la prod sert |
|---|---|---|
| Version | **v1.3.0** | **v1.6.4** |
| Emplacement | `v1/tracker.js` (local **et** `origin/main`) | repo **`jamespicard-del/jpmetrix-cdn`** → `track.jpmetrix.com/v1/tracker.js` |
| Dernier tag | `v1.3.0` (12 mai 2026) | — (commits directs, aucun tag) |

**Mesuré le 2026-07-16** (`curl https://track.jpmetrix.com/v1/tracker.js` + clone de `jpmetrix-cdn`), pas déduit.

### Ce que ce repo ne contient PAS (et que la prod fait)
- **v1.4** — rename `jps_uid` → **`jpm_uid`** + injection UID form/iframe
- **v1.5** — injection `?jpm_uid=<UID>` via `history.replaceState` (contourne le naming par hexId des hidden inputs GHL)
- **v1.6.0** — `setReactiveValue()` framework-aware (Vue/React/Angular `v-model` — requis par les forms Vue de GHL Funnel)
- **v1.6.1** — `form_view`/`form_start` sur les **forms modernes GHL** rendus en `<div id="_builder-form">` au lieu de `<form>` ; `computeFormId` basé sur `data-q`
- **v1.6.2/3/4** — capture `_fbc`/`_fbp` (Pixel FB) pour la dédup CAPI server-side + fix d'une race condition d'init

⚠️ Le cookie UID a été renommé (`jps_uid` → `jpm_uid` en v1.4). Toute doc de ce repo qui dit `jps_uid` est fausse.

### Comment on en est arrivé là (la cause, pas le symptôme)
Le pipeline voulu : **`utm-tracker` = source → tag `vX.Y.Z` → Action `publish-cdn.yml` → publie dans `jpmetrix-cdn`**. Le README de `jpmetrix-cdn` l'écrit noir sur blanc : *« Do not commit tracker.js changes directly here. »*

**Le pipeline n'est pas cassé — il a été ABANDONNÉ.** L'Action a tourné avec succès pour `v1.2.0` (10 mai) et `v1.3.0` (12 mai), puis **plus aucun run**. Dès v1.4, tout a été committé **directement dans `jpmetrix-cdn`**, contournant la source *et* le pipeline. Résultat : la source est en retard de 6 versions sur l'artefact, et ce fichier a menti ~2 mois.

C'est l'invariant #3 du standard OS qui saute (*« un fork = déclaré, jamais fantôme »*) : deux copies, aucune désignée, un agent édite la mauvaise. **C'est exactement ce qui s'est produit le 2026-07-16** — une session a codé le stitch courriel (#352) une heure durant sur cette base morte avant de s'en apercevoir via un `curl` sur la prod. Travail reverté, aucune régression livrée.

---

## 🎯 GOAL + critère de succès (BINAIRE)
**Goal :** script JS léger qui capture UTM + click IDs (fbclid/gclid) et auto-remplit les champs GHL → attribution marketing fiable pour les clients JPS.

**Critères binaires :**
- Tracker **feature-complete + production-stable** — ✅ OUI (v1.6.4 en prod), mais ⚠️ **sa source n'est plus ici**.
- **Une seule source de vérité désignée** — ❌ **NON → c'est le goulot.**
- **Onboarding client repeatable** (SOP + handoff package) — ❌ NON.

---

## 🚧 GOULOT
**Deux copies du tracker, aucune désignée comme la source.** Tant que ce n'est pas tranché, tout travail sur le tracker part potentiellement de la mauvaise base (déjà arrivé une fois). Ça bloque **#352** (stitch courriel), dont la pièce tracker doit se poser sur v1.6.4 → **v1.7.0** (⚠️ `v1.4` est déjà pris).

**Le SOP d'onboarding** (ex-goulot) passe second : inutile de rendre repeatable l'install d'un script dont on ne sait pas où il vit.

---

## ⏭️ FILE D'ACTIONS
1. **🔴 TRANCHER (call James) — où vit la source du tracker ?**
   - **Option A — rapatrier** (= le design d'origine) : copier v1.6.4 ici, tagger `v1.6.4`, laisser l'Action republier, re-verrouiller « zéro commit direct dans le CDN ». Le pipeline marche déjà, il est juste inutilisé.
   - **Option B — adopter** : déclarer `jpmetrix-cdn` source officielle, archiver ce repo, réécrire son README (qui interdit aujourd'hui ce qu'on y ferait).
   - **Ne pas trancher = laisser le piège armé.**
2. Une fois tranché : porter le stitch courriel #352 sur v1.6.4 → **v1.7.0**. Patch + 6 tests Playwright verts prêts (session 2026-07-16, sauvegardés hors repo — voir le ticket).
3. **Vérifier quelle version chaque client a installée** — ⚠️ peut réécrire le diagnostic de #352 : le ticket attribue le `jpm_uid` à 2,5 % chez LD à l'hypothèse « champ jamais ajouté aux forms », **or v1.5/v1.6 existent précisément pour réparer ce remplissage**. Si LD est resté sur v1.3, le 2,5 % s'explique tout seul.
4. SOP onboarding client (checklist GHL + testing + go-live).

---

## 📓 DÉCISIONS (+ le pari)
- **IDs vs names** dans les UTM (campaign/adset/ad = IDs) — pari : immutabilité > lisibilité ; renommer une campagne ne casse pas l'analytics (pas de doublons au GROUP BY).
- **jsdelivr vs raw.githubusercontent** — raw renvoie un mauvais MIME (`text/plain`) → jsdelivr obligatoire. ⚠️ **Historique** : la prod ne passe plus par jsdelivr (cf. `CLAUDE.md §CDN`).
- **Pipeline source→tag→Action→CDN** (mai 2026) — pari : la source reste éditable et versionnée, le CDN reste un artefact. **Pari PERDU dans les faits** : contourné dès v1.4, personne ne l'a signalé pendant 2 mois. Une règle écrite dans un README ne tient pas si rien ne la force.

---

## 👥 ACTEURS
| Acteur | Rôle ici | Trigger |
|---|---|---|
| **Clients JPS sur GHL** | consommateurs du tracker | onboarding → James fait le setup (single point) |
| **JPS_produit** (aval) | consomme les UTM captés (`private.leads`) + les beacons (`private.touches`) | si l'attribution casse côté produit → vérifier le tracker en amont, **dans `jpmetrix-cdn`, pas ici** |

*Lien data : ce tracker alimente l'attribution analysée dans `Business/JPS/JPS_produit/CONTEXT.md`.*

---

## 🗺️ Fichiers clés
⚠️ **`v1/tracker.js` (ce repo) = PÉRIMÉ (v1.3.0).** Le code vivant : `jpmetrix-cdn` → `v1/tracker.js` (v1.6.4).
`.github/workflows/publish-cdn.yml` (le pipeline abandonné) · `docs/QUICKREF.md` (client-ready) · `docs/INSTALLATION.md` · `docs/FACEBOOK-SETUP.md` · `docs/GOOGLE-ADS-SETUP.md` · `CHANGELOG.md` (⚠️ s'arrête à v1.3.0) · sessions → `archive/sessions/`.
