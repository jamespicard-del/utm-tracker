# Configuration UTM - Facebook Ads

**Temps requis:** 5 minutes par campagne
**Objectif:** Ajouter les paramètres UTM à vos publicités Facebook pour tracker l'attribution des leads

---

## Pourquoi Configurer les UTM dans Facebook

Sans UTM, vous savez qu'un lead vient de "Facebook" (via le CRM), mais vous ne savez PAS:
- ✅ De quelle campagne précise
- ✅ De quel ensemble de publicités (adset)
- ✅ De quelle publicité individuelle (ad)
- ✅ De quel placement (feed, stories, reels)

**Avec UTM configurés correctement:**
- Vous pouvez identifier quelle pub spécifique génère le plus de leads
- Vous pouvez calculer le ROI par campagne/adset/ad
- Vous pouvez optimiser en coupant les pubs non-performantes

---

## Méthode 1: Template URL avec Paramètres Dynamiques (RECOMMANDÉ)

### Étape 1: Copier le Template

**Template UTM complet pour Facebook:**

```
?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{adset.name}}&utm_term={{ad.name}}
```

**Explication des paramètres:**
- `utm_source=facebook` → Fixe, identifie la source comme Facebook
- `utm_medium=cpc` → Fixe, indique que c'est du trafic payant (cost-per-click)
- `utm_campaign={{campaign.name}}` → Dynamique, remplacé automatiquement par le nom de votre campagne
- `utm_content={{adset.name}}` → Dynamique, nom de l'ensemble de publicités
- `utm_term={{ad.name}}` → Dynamique, nom de la publicité individuelle

**Avantage:** Une fois configuré, Facebook remplit automatiquement les valeurs. Vous n'avez rien à faire manuellement.

### Étape 2: Ajouter le Template à votre Campagne Facebook

#### Option A: Au Niveau de la Publicité (Recommended)

**Navigation dans Facebook Ads Manager:**

1. **Aller dans Ads Manager** → https://business.facebook.com/adsmanager
2. **Sélectionner votre campagne** → Cliquer sur l'ensemble de publicités → Cliquer sur la publicité
3. **Section "Ad Setup"** → Scroller jusqu'à "Destination"
4. **Champ "Website URL":**
   ```
   https://votre-landing-page.com?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{adset.name}}&utm_term={{ad.name}}
   ```

**Exemple concret:**

Si votre landing page est `https://lesdeckdedree.com/contact`, l'URL devient:

```
https://lesdeckdedree.com/contact?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{adset.name}}&utm_term={{ad.name}}
```

**Résultat après Facebook remplace les variables:**

```
https://lesdeckdedree.com/contact?utm_source=facebook&utm_medium=cpc&utm_campaign=Hiver_2025_Promotion&utm_content=Audience_Lookalike_1&utm_term=Video_Temoignage_Client
```

#### Option B: Au Niveau de la Campagne (Template pour toutes les pubs)

**Si vous voulez appliquer à TOUTES les pubs de la campagne:**

1. **Ads Manager** → **Campagnes** → Sélectionner votre campagne
2. **Cliquer sur "Edit"**
3. **Section "Campaign Details"** → Activer "URL Parameters"
4. **Entrer les paramètres:**
   ```
   utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{adset.name}}&utm_term={{ad.name}}
   ```

**Note:** Pas besoin du `?` au début si vous utilisez "URL Parameters" (Facebook l'ajoute automatiquement).

---

## Méthode 2: UTM Manuels (Déconseillé)

**Si vous ne voulez PAS utiliser les paramètres dynamiques:**

**Template manuel:**
```
https://votre-page.com?utm_source=facebook&utm_medium=cpc&utm_campaign=NomCampagne&utm_content=NomAdset&utm_term=NomAd
```

**Inconvénients:**
- ❌ Vous devez écrire manuellement chaque nom
- ❌ Risque d'erreurs (typos, noms incohérents)
- ❌ Chronophage si vous avez beaucoup de pubs
- ❌ Pas de synchronisation automatique si vous renommez une campagne

**Recommandation:** Utilisez Méthode 1 (paramètres dynamiques).

---

## Paramètres Dynamiques Disponibles dans Facebook

**Campagne:**
- `{{campaign.name}}` → Nom de la campagne
- `{{campaign.id}}` → ID unique de la campagne

**Ensemble de Publicités (Adset):**
- `{{adset.name}}` → Nom de l'ensemble de publicités
- `{{adset.id}}` → ID unique de l'adset

**Publicité (Ad):**
- `{{ad.name}}` → Nom de la publicité
- `{{ad.id}}` → ID unique de la pub

**Placement:**
- `{{placement}}` → Ex: feed, stories, reels, etc.

**Template Avancé (Inclut Placement):**

```
?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{adset.name}}&utm_term={{ad.name}}_{{placement}}
```

**Exemple de résultat:**
```
utm_term=Video_Temoignage_feed
utm_term=Video_Temoignage_stories
```

Cela vous permet de savoir si Feed vs Stories performe mieux.

---

## Convention de Nommage (Best Practices)

**Pour que les UTM soient lisibles dans vos rapports:**

### Noms de Campagne

**Format recommandé:** `Objectif_Saison_Type`

**Exemples:**
- `LeadGen_Hiver2025_Video`
- `LeadGen_Ete2025_Carousel`
- `Retargeting_Q1_2025`

**Éviter:**
- ❌ Espaces → Remplacés par `%20` dans l'URL (pas lisible)
- ❌ Caractères spéciaux (`é`, `à`, `ç`) → Encodés en URL
- ✅ Utiliser underscores `_` ou tirets `-`

### Noms d'Ensemble de Publicités

**Format recommandé:** `Audience_Budget_Zone`

**Exemples:**
- `Lookalike_50CAD_Montreal`
- `Interest_Renovation_30CAD_Quebec`
- `Retargeting_WebsiteVisitors_20CAD`

### Noms de Publicités

**Format recommandé:** `Format_Message_Version`

**Exemples:**
- `Video_Temoignage_V1`
- `Carousel_AvantApres_V2`
- `Image_Promo_Hiver_V1`

**Astuce:** Ajouter `_V1`, `_V2` pour tester différentes versions de la même pub.

---

## Vérifier que les UTM Fonctionnent

### Test 1: Preview de la Pub

1. **Dans Ads Manager** → Sélectionner votre publicité
2. **Cliquer sur "Preview Ad"**
3. **Clic droit sur le bouton CTA** → "Copier l'adresse du lien"
4. **Coller dans un éditeur de texte**

**Exemple de résultat attendu:**

```
https://votre-page.com?utm_source=facebook&utm_medium=cpc&utm_campaign=LeadGen_Hiver2025&utm_content=Lookalike_50CAD&utm_term=Video_Temoignage_V1&fbclid=...
```

**Vérifier:**
- ✅ `{{campaign.name}}` remplacé par le vrai nom
- ✅ `{{adset.name}}` remplacé par le vrai nom
- ✅ `{{ad.name}}` remplacé par le vrai nom

**Si les `{{}}` sont encore là:** Facebook n'a pas remplacé les variables → Vérifier que vous utilisez bien les paramètres dynamiques de Facebook (pas d'autres systèmes).

### Test 2: Cliquer sur la Pub en Mode Test

1. **Activer la pub en mode "Test"** (pas de budget réel)
2. **Trouver votre pub dans le feed Facebook** (depuis votre compte personnel ou compte test)
3. **Cliquer sur la pub** → Vous arrivez sur votre landing page
4. **Regarder l'URL dans la barre d'adresse**

**URL attendue:**
```
https://votre-page.com?utm_source=facebook&utm_medium=cpc&utm_campaign=LeadGen_Hiver2025&utm_content=Lookalike_50CAD&utm_term=Video_Temoignage_V1&fbclid=IwAR...
```

**Note:** `fbclid=...` est ajouté automatiquement par Facebook (ignorez-le, ça n'affecte pas les UTM).

### Test 3: Vérifier dans GHL

1. **Soumettre un formulaire test** depuis la landing page après avoir cliqué la pub
2. **Aller dans GHL → Contacts** → Trouver le contact test
3. **Custom Fields** → Vérifier:
   - `utm_source` = `facebook`
   - `utm_medium` = `cpc`
   - `utm_campaign` = Le nom réel de votre campagne
   - `utm_content` = Le nom réel de votre adset
   - `utm_term` = Le nom réel de votre ad

**Si les champs sont vides:**
- Vérifier que le script UTM Tracker est bien installé (voir [INSTALLATION.md](INSTALLATION.md))
- Vérifier que les champs cachés existent dans le formulaire
- Vérifier que les Field Keys sont corrects (`utm_source`, etc.)

---

## Conventions UTM Spécifiques par Type de Campagne

### Campagnes Lead Generation

```
utm_source=facebook
utm_medium=cpc
utm_campaign=LeadGen_[Saison]_[Type]
utm_content=[Audience]_[Budget]
utm_term=[Format]_[Message]_[Version]
```

**Exemple:**
```
?utm_source=facebook&utm_medium=cpc&utm_campaign=LeadGen_Hiver2025_Video&utm_content=Lookalike_50CAD&utm_term=Video_Temoignage_V1
```

### Campagnes Retargeting

```
utm_source=facebook
utm_medium=retargeting
utm_campaign=Retargeting_[Segment]_[Saison]
utm_content=[Message]_[Offre]
utm_term=[Format]_[Version]
```

**Exemple:**
```
?utm_source=facebook&utm_medium=retargeting&utm_campaign=Retargeting_WebsiteVisitors_Q1&utm_content=Promo_Rabais20&utm_term=Carousel_V2
```

### Campagnes Événements

```
utm_source=facebook
utm_medium=cpc
utm_campaign=Event_[NomEvenement]_[Date]
utm_content=[Audience]
utm_term=[Format]_[Version]
```

**Exemple:**
```
?utm_source=facebook&utm_medium=cpc&utm_campaign=Event_Portes_Ouvertes_Mars2025&utm_content=LocalAudience_5km&utm_term=Video_Invitation_V1
```

---

## Erreurs Fréquentes à Éviter

### 1. Oublier le `?` avant les UTM

**Mauvais:**
```
https://site.com/utm_source=facebook
```

**Correct:**
```
https://site.com?utm_source=facebook
```

**Si vous avez déjà un `?` dans l'URL:**

```
https://site.com?page=contact&utm_source=facebook
```

Utilisez `&` pour ajouter les UTM après le premier paramètre.

### 2. Utiliser des Espaces dans les Noms

**Mauvais:**
```
utm_campaign=Lead Gen Hiver 2025
```

**Dans l'URL devient:**
```
utm_campaign=Lead%20Gen%20Hiver%202025
```

**Correct:**
```
utm_campaign=LeadGen_Hiver_2025
```

### 3. Noms Incohérents

**Problème:**
- Campagne 1: `utm_campaign=hiver_2025`
- Campagne 2: `utm_campaign=Hiver2025`
- Campagne 3: `utm_campaign=HIVER-2025`

**Dans vos rapports:** 3 campagnes différentes au lieu d'une seule.

**Solution:** Choisir UNE convention et la respecter partout (ex: `Hiver_2025`).

### 4. Dupliquer les Paramètres

**Mauvais:**
```
?utm_source=facebook&utm_source=meta
```

**Résultat:** Seul le dernier `utm_source` est conservé → Données perdues.

**Correct:**
```
?utm_source=facebook
```

---

## Checklist Post-Configuration

- [ ] Template UTM ajouté à toutes les campagnes actives
- [ ] Paramètres dynamiques `{{campaign.name}}` etc. utilisés
- [ ] Noms de campagnes suivent convention (pas d'espaces)
- [ ] Test preview vérifié (variables remplacées)
- [ ] Pub test cliquée → URL contient les UTM corrects
- [ ] Lead test créé dans GHL → Custom Fields remplis
- [ ] Documentation remise au client

---

## Ressources Supplémentaires

**Facebook Ads Manager:** https://business.facebook.com/adsmanager
**Documentation paramètres dynamiques:** https://www.facebook.com/business/help/2360940870872492
**Guide installation script:** [INSTALLATION.md](INSTALLATION.md)
**Dépannage:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Configuration Facebook terminée!** Vos publicités trackent maintenant l'attribution complète.
