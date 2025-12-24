# Guide d'Installation - UTM Tracker

**Temps requis:** 15 minutes par client
**Objectif:** Installer le script de tracking UTM sur les pages GoHighLevel de vos clients

---

## Ce que fait ce script

Le script capture automatiquement les paramètres UTM (source, medium, campaign, etc.) depuis les URLs de vos publicités Facebook/Google et remplit les champs cachés dans vos formulaires.

**Exemple:**
- Visiteur clique sur pub Facebook → Arrive sur landing page avec `?utm_source=facebook&utm_campaign=hiver2025`
- Script sauvegarde ces infos dans un cookie (valide 30 jours)
- Visiteur navigue sur plusieurs pages → Cookie persiste
- Visiteur remplit formulaire contact → Champs UTM remplis automatiquement
- Vous recevez le lead avec attribution complète dans GHL

**Avantages:**
- Savoir quelle pub a généré quel lead
- Attribution multi-page (visiteur peut naviguer avant de convertir)
- Aucun travail manuel requis après l'installation
- Compatible avec tous les CRM (GHL, Pipedrive, HubSpot, etc.)

---

## Étape 1: Ajouter le Script au Funnel GHL

### Option A: Tracking Code au Niveau Funnel (RECOMMANDÉ)

**Navigation:** Funnels → [Sélectionner votre funnel] → Settings → Tracking Code

**Code à copier-coller dans "Header Tracking Code":**

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>
```

**IMPORTANT:** Remplacer `YOUR-USERNAME` par votre nom d'utilisateur GitHub.

**Pourquoi cette option:**
- ✅ Le script s'applique à TOUTES les pages du funnel automatiquement
- ✅ Un seul endroit à gérer
- ✅ Tracking multi-page garanti

### Option B: Custom Code au Niveau de la Page (Si Option A n'existe pas)

**Navigation:** Pages → [Sélectionner la page] → Settings → Custom Code

**Code à copier-coller dans "Head Code":**

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>
```

**ATTENTION:** Si vous utilisez cette option, vous devez ajouter le script à CHAQUE page du funnel pour que le tracking multi-page fonctionne.

---

## Étape 2: Créer les Champs Cachés dans vos Formulaires

### Dans GoHighLevel

**Navigation:** Sites → Forms → [Sélectionner votre formulaire] → Edit Form

**Ajouter 5 champs cachés (Custom Fields):**

| Nom Affiché | Type de Champ | Field Key (IMPORTANT) |
|-------------|---------------|----------------------|
| UTM Source | Hidden | `utm_source` |
| UTM Medium | Hidden | `utm_medium` |
| UTM Campaign | Hidden | `utm_campaign` |
| UTM Term | Hidden | `utm_term` |
| UTM Content | Hidden | `utm_content` |

**CRITIQUE:** Le "Field Key" (ou "name attribute") DOIT être exactement comme indiqué ci-dessus. Le script cherche ces noms précis.

### Étapes Détaillées

1. **Cliquer sur "Add Custom Field"** (ou "Add Element" → "Custom Field")
2. **Choisir "Hidden"** comme type
3. **Entrer le nom:** "UTM Source"
4. **Field Key:** `utm_source` (tout en minuscules, avec underscore)
5. **Répéter pour les 4 autres champs**

**Note:** Les champs cachés n'apparaissent PAS sur le formulaire visible par l'utilisateur. Ils sont remplis automatiquement par le script.

---

## Étape 3: Tester l'Installation

### Test Simple (1 page)

1. **Visitez votre landing page avec paramètres UTM:**
   ```
   https://votre-page.com?utm_source=test&utm_medium=manuel&utm_campaign=installation
   ```

2. **Ouvrir les outils développeur du navigateur:**
   - Chrome/Edge: Clic droit → Inspecter → Console
   - Firefox: Clic droit → Inspecter l'élément → Console

3. **Vérifier les messages dans la console:**
   ```
   [UTM Tracker] UTM Tracker v1.0.2 initializing...
   [UTM Tracker] UTM parameters captured {utm_source: "test", utm_medium: "manuel", ...}
   [UTM Tracker] Populating form fields with UTM data
   [UTM Tracker] Populated field: utm_source = test
   ```

4. **Remplir et soumettre le formulaire test**

5. **Vérifier dans GHL Contact:**
   - Aller dans Contacts → [Le contact que vous venez de créer]
   - Scroller jusqu'aux "Custom Fields"
   - Confirmer que `utm_source`, `utm_medium`, etc. sont remplis

### Test Multi-Page (Critique pour Funnels)

1. **Visiter page 1 avec UTM:**
   ```
   https://votre-landing.com?utm_source=facebook&utm_campaign=hiver
   ```

2. **Naviguer vers page 2 (SANS UTM dans l'URL):**
   ```
   https://votre-landing.com/about
   ```

3. **Naviguer vers page 3 avec formulaire (SANS UTM dans l'URL):**
   ```
   https://votre-landing.com/contact
   ```

4. **Soumettre le formulaire**

5. **Vérifier que le contact a les UTM de la page 1**

**Si ça ne marche pas:**
- Vérifier que le script est installé au niveau FUNNEL (pas seulement une page)
- Vérifier que les cookies sont activés dans le navigateur
- Vérifier que le domaine est le même (pas de changement http → https)

---

## Étape 4: Configurer le Webhook vers Supabase (Optionnel)

**Si vous utilisez JPS Analytics:**

1. **Dans GHL → Workflows → Create New Workflow**
2. **Trigger:** "Form Submitted" → Sélectionner vos formulaires
3. **Action:** "Send Outbound Webhook"
4. **URL:** `https://db.bqjquezmnwzcmghypbil.supabase.co/rest/v1/leads_staging`
5. **Headers:**
   ```
   apikey: [VOTRE_SUPABASE_ANON_KEY]
   Authorization: Bearer [VOTRE_SUPABASE_ANON_KEY]
   Content-Type: application/json
   Prefer: return=minimal
   ```
6. **Body (JSON):**
   ```json
   {
     "account_id": "{{account_id}}",
     "source_system": "gohighlevel",
     "external_id": "{{contact.id}}",
     "first_name": "{{contact.first_name}}",
     "last_name": "{{contact.last_name}}",
     "email": "{{contact.email}}",
     "phone": "{{contact.phone}}",
     "utm_source": "{{contact.utm_source}}",
     "utm_medium": "{{contact.utm_medium}}",
     "utm_campaign": "{{contact.utm_campaign}}",
     "utm_term": "{{contact.utm_term}}",
     "utm_content": "{{contact.utm_content}}"
   }
   ```

**Note:** Les champs `{{contact.utm_source}}` etc. viennent des Custom Fields que vous avez créés à l'étape 2.

---

## Règle d'Or: UN SEUL ENDROIT

**NE PAS installer le script à plusieurs endroits:**

❌ **Éviter:**
- Script au niveau Funnel ET au niveau Page
- Script dans plusieurs Custom Code sections

✅ **Correct:**
- Script au niveau Funnel SEULEMENT (Option A)
- OU Script au niveau de CHAQUE page (Option B si Option A impossible)

**Pourquoi:** Installer plusieurs fois peut causer des conflits et des doublons dans les données.

---

## Dépannage

### Problème: Les champs ne se remplissent pas

**Solutions:**
1. **Vérifier Field Key:** Doit être exactement `utm_source`, `utm_medium`, etc. (minuscules, underscore)
2. **Vérifier type de champ:** Doit être "Hidden" ou "Text" (pas Dropdown/Radio)
3. **Activer debug mode:**
   ```html
   <script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js"></script>
   <script>
     JPSUTMTracker.debug(true);
   </script>
   ```
4. **Regarder la console navigateur:** Chercher messages d'erreur

### Problème: Tracking multi-page ne fonctionne pas

**Solutions:**
1. **Vérifier cookies activés:** Paramètres navigateur → Autoriser cookies
2. **Vérifier domaine cohérent:** Toutes les pages doivent être sur le même domaine (ex: `site.com`, pas `site1.com` → `site2.com`)
3. **Vérifier script sur toutes les pages:** Si Option B, le script doit être sur CHAQUE page

### Problème: Script ne se charge pas

**Solutions:**
1. **Vérifier connexion internet**
2. **Tester URL CDN directement:** Copier `https://cdn.jsdelivr.net/gh/YOUR-USERNAME/utm-tracker@v1/v1/tracker.js` dans navigateur
3. **Vérifier GitHub repo public:** Le repo doit être public pour que jsDelivr puisse le servir

---

## Checklist Post-Installation

- [ ] Script ajouté au Funnel Settings → Tracking Code
- [ ] 5 champs cachés créés dans le formulaire (Field Keys corrects)
- [ ] Test simple réussi (1 page avec UTM)
- [ ] Test multi-page réussi (navigation sans UTM → formulaire)
- [ ] Contact créé dans GHL avec UTM remplis
- [ ] Webhook Supabase configuré (si applicable)
- [ ] Documentation remise au client (ce fichier)

---

## Support

**Questions fréquentes:** Voir [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
**Configuration Facebook Ads:** Voir [FACEBOOK-SETUP.md](FACEBOOK-SETUP.md)
**Configuration Google Ads:** Voir [GOOGLE-ADS-SETUP.md](GOOGLE-ADS-SETUP.md)

---

**Installation terminée!** Vos leads auront maintenant une attribution marketing complète.
