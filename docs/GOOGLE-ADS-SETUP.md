# Configuration UTM - Google Ads

**Temps requis:** 5 minutes par campagne
**Objectif:** Ajouter les paramètres UTM à vos publicités Google Ads pour tracker l'attribution des leads

---

## Pourquoi Configurer les UTM dans Google Ads

Sans UTM, vous savez qu'un lead vient de "Google Ads" (via le CRM), mais vous ne savez PAS:
- ✅ De quelle campagne précise
- ✅ De quel groupe d'annonces (ad group)
- ✅ De quelle annonce individuelle
- ✅ De quel mot-clé (keyword) qui a déclenché la pub

**Avec UTM configurés correctement:**
- Vous pouvez identifier quel mot-clé génère le plus de leads
- Vous pouvez calculer le ROI par campagne/groupe/mot-clé
- Vous pouvez optimiser en ajustant les enchères sur les mots-clés performants

---

## Option 1: Auto-Tagging Google (Simple mais Limité)

**Qu'est-ce que l'auto-tagging?**

Google Ads ajoute automatiquement un paramètre `gclid` (Google Click ID) à vos URLs:

```
https://votre-page.com?gclid=Cj0KCQiA...
```

**Avantages:**
- ✅ Activation en 1 clic
- ✅ Données automatiques dans Google Analytics
- ✅ Aucune maintenance

**Inconvénients:**
- ❌ Pas de données dans votre CRM (GHL, Pipedrive, etc.)
- ❌ Pas de visibilité sur campagne/mot-clé dans les Custom Fields
- ❌ Dépendant de Google Analytics (pas de contrôle direct)

**Quand utiliser:**
- Vous utilisez Google Analytics et n'avez pas besoin des UTM dans votre CRM

**Comment activer:**

1. **Google Ads** → **Settings** (roue dentée) → **Account Settings**
2. **Auto-tagging** → Activer "Tag the URL that people click through from my ad"
3. **Save**

**Note:** Si vous activez l'auto-tagging, vous n'avez PAS besoin de configurer les UTM manuels (Option 2 ci-dessous).

---

## Option 2: Paramètres UTM Manuels (RECOMMANDÉ pour CRM)

**Pourquoi cette option:**
- ✅ Données UTM visibles dans votre CRM (GHL custom fields)
- ✅ Compatible avec votre système d'attribution marketing
- ✅ Contrôle total sur les noms de campagne/groupe/mot-clé

### Étape 1: Copier le Template UTM

**Template UTM complet pour Google Ads:**

```
?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}
```

**Explication des paramètres:**
- `utm_source=google` → Fixe, identifie la source comme Google
- `utm_medium=cpc` → Fixe, indique que c'est du trafic payant
- `utm_campaign={campaignid}` → Dynamique, remplacé par l'ID de la campagne
- `utm_content={adgroupid}` → Dynamique, ID du groupe d'annonces
- `utm_term={keyword}` → Dynamique, mot-clé qui a déclenché la pub

**Avantage:** Google remplit automatiquement les valeurs. Aucun travail manuel requis.

### Étape 2: Ajouter le Template à votre Campagne Google Ads

#### Option A: Au Niveau de la Campagne (Appliqué à TOUTES les annonces)

**Navigation dans Google Ads:**

1. **Google Ads** → **Campaigns** → Sélectionner votre campagne
2. **Settings** (onglet à gauche) → Scroller jusqu'à "Campaign URL options"
3. **Cliquer sur "Show advanced URL options"**
4. **Champ "Tracking template":** Laisser vide
5. **Champ "Final URL suffix":** Entrer:
   ```
   utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}
   ```

**Note:** Pas besoin du `?` au début (Google l'ajoute automatiquement).

**Résultat:**

Si votre annonce pointe vers `https://votre-page.com`, l'URL finale devient:

```
https://votre-page.com?utm_source=google&utm_medium=cpc&utm_campaign=12345678&utm_content=98765432&utm_term=plombier+montreal
```

#### Option B: Au Niveau de l'Annonce (Contrôle Granulaire)

**Si vous voulez des UTM différents par annonce:**

1. **Google Ads** → **Ads & extensions** → Sélectionner votre annonce
2. **Edit** → **Ad URL options** → Activer "Show advanced URL options"
3. **Final URL suffix:**
   ```
   utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}
   ```

**Recommandation:** Utilisez Option A (niveau campagne) pour simplifier la gestion.

---

## Template Avancé avec Noms Lisibles

**Problème avec le template de base:**

Les IDs (`{campaignid}`, `{adgroupid}`) ne sont pas lisibles dans vos rapports:

```
utm_campaign=12345678  ← Quel nom de campagne correspond à cet ID?
```

**Solution:** Combiner IDs et noms

**Template avancé:**

```
utm_source=google&utm_medium=cpc&utm_campaign={campaignid}_{campaign}&utm_content={adgroupid}_{adgroup}&utm_term={keyword}
```

**Paramètres dynamiques disponibles:**

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `{campaignid}` | ID unique de la campagne | `12345678` |
| `{campaign}` | Nom de la campagne | `LeadGen_Plomberie_Montreal` |
| `{adgroupid}` | ID unique du groupe d'annonces | `98765432` |
| `{adgroup}` | Nom du groupe d'annonces | `Urgence_Plomberie` |
| `{keyword}` | Mot-clé qui a déclenché la pub | `plombier+urgence+montreal` |
| `{placement}` | Site où la pub apparaît (Display Network) | `example.com` |
| `{device}` | Type d'appareil | `mobile`, `desktop`, `tablet` |
| `{matchtype}` | Type de correspondance mot-clé | `e` (exact), `p` (phrase), `b` (broad) |

**Exemple de résultat avec template avancé:**

```
https://votre-page.com?utm_source=google&utm_medium=cpc&utm_campaign=12345678_LeadGen_Plomberie_Montreal&utm_content=98765432_Urgence_Plomberie&utm_term=plombier+urgence+montreal
```

**Avantages:**
- ✅ IDs pour tracking précis (immutables)
- ✅ Noms pour lisibilité dans les rapports
- ✅ Tracabilité même si vous renommez une campagne

**Inconvénient:**
- URLs plus longues (mais pas un problème pour les utilisateurs, juste dans les logs)

---

## Convention de Nommage (Best Practices)

**Pour que les UTM soient lisibles dans vos rapports:**

### Noms de Campagne

**Format recommandé:** `Objectif_Service_Zone`

**Exemples:**
- `LeadGen_Plomberie_Montreal`
- `LeadGen_Toiture_Quebec`
- `Retargeting_WebsiteVisitors_Q1`

**Éviter:**
- ❌ Espaces → Remplacés par `+` dans l'URL
- ❌ Caractères spéciaux (`é`, `à`, `ç`) → Encodés
- ✅ Utiliser underscores `_` ou tirets `-`

### Noms de Groupe d'Annonces

**Format recommandé:** `Service_TypeUrgence`

**Exemples:**
- `Urgence_Plomberie`
- `Planifie_Renovation`
- `Commercial_Toiture`

### Mots-Clés

**Google remplace automatiquement `{keyword}`:**

**Exemples de résultat:**
- `plombier+urgence+montreal`
- `renovation+salle+bain`
- `toiture+commercial+prix`

**Note:** Les espaces sont remplacés par `+` automatiquement par Google.

---

## Auto-Tagging + UTM Manuels: Possible?

**Question:** Puis-je utiliser l'auto-tagging Google ET les UTM manuels en même temps?

**Réponse:** Oui, mais avec précautions.

**Configuration compatible:**

1. **Activer auto-tagging:** Google ajoute `gclid=...`
2. **Ajouter UTM manuels:** Vous ajoutez `utm_source`, `utm_campaign`, etc.

**Résultat URL:**

```
https://votre-page.com?utm_source=google&utm_medium=cpc&utm_campaign=LeadGen_Plomberie&utm_term=plombier+montreal&gclid=Cj0KCQiA...
```

**Avantages:**
- ✅ Google Analytics reçoit `gclid` pour son tracking
- ✅ Votre CRM (GHL) reçoit les UTM pour attribution
- ✅ Double redondance (si un système échoue, l'autre fonctionne)

**Attention:**

Dans **Google Analytics**, si vous utilisez les deux:
- **UTM manuels** écrasent les données auto-tagging dans certains rapports
- Assurez-vous que vos UTM manuels correspondent aux noms de campagne Google

**Recommandation:**
- Si vous utilisez principalement Google Analytics → Auto-tagging seul
- Si vous utilisez principalement votre CRM (GHL) → UTM manuels seul
- Si vous voulez les deux → Auto-tagging + UTM manuels (configuration ci-dessus)

---

## Vérifier que les UTM Fonctionnent

### Test 1: Preview de l'Annonce

1. **Google Ads** → **Ads & extensions** → Sélectionner votre annonce
2. **Cliquer sur l'icône "Preview"** (œil) à droite
3. **Choisir "Mobile" ou "Desktop"** → Google affiche un aperçu
4. **Cliquer sur l'annonce dans le preview** → Copier l'URL finale

**Exemple de résultat attendu:**

```
https://votre-page.com?utm_source=google&utm_medium=cpc&utm_campaign=12345678&utm_content=98765432&utm_term=plombier+montreal
```

**Vérifier:**
- ✅ `{campaignid}` remplacé par un nombre
- ✅ `{adgroupid}` remplacé par un nombre
- ✅ `{keyword}` remplacé par un mot-clé réel

**Si les `{}` sont encore là:** Google n'a pas remplacé les variables → Vérifier que vous utilisez bien le "Final URL suffix" (pas un autre champ).

### Test 2: Cliquer sur l'Annonce en Mode Test

**ATTENTION:** Cliquer sur vos propres annonces Google peut fausser vos statistiques et coûter de l'argent.

**Méthode sécurisée:**

1. **Google Ads** → **Tools & Settings** → **Ad Preview and Diagnosis**
2. **Entrer votre mot-clé** → Sélectionner localisation et langue
3. **Cliquer sur votre annonce dans le preview** (ne coûte rien)
4. **Regarder l'URL dans la barre d'adresse**

**URL attendue:**

```
https://votre-page.com?utm_source=google&utm_medium=cpc&utm_campaign=LeadGen_Plomberie&utm_term=plombier+urgence
```

### Test 3: Vérifier dans GHL

1. **Soumettre un formulaire test** depuis la landing page après avoir cliqué l'annonce
2. **Aller dans GHL → Contacts** → Trouver le contact test
3. **Custom Fields** → Vérifier:
   - `utm_source` = `google`
   - `utm_medium` = `cpc`
   - `utm_campaign` = L'ID ou le nom de votre campagne
   - `utm_content` = L'ID du groupe d'annonces
   - `utm_term` = Le mot-clé

**Si les champs sont vides:**
- Vérifier que le script UTM Tracker est bien installé (voir [INSTALLATION.md](INSTALLATION.md))
- Vérifier que les champs cachés existent dans le formulaire
- Vérifier que les Field Keys sont corrects (`utm_source`, etc.)

---

## Conventions UTM Spécifiques par Type de Campagne

### Campagnes Search (Recherche)

```
utm_source=google
utm_medium=cpc
utm_campaign={campaignid}_{campaign}
utm_content={adgroupid}_{adgroup}
utm_term={keyword}
```

**Exemple:**
```
?utm_source=google&utm_medium=cpc&utm_campaign=12345678_LeadGen_Plomberie&utm_content=98765432_Urgence&utm_term=plombier+urgence+montreal
```

### Campagnes Display (Bannières)

```
utm_source=google
utm_medium=display
utm_campaign={campaignid}_{campaign}
utm_content={adgroupid}_{placement}
utm_term={creative}
```

**Exemple:**
```
?utm_source=google&utm_medium=display&utm_campaign=12345678_Retargeting_Q1&utm_content=98765432_example.com&utm_term=banniere_300x250
```

### Campagnes Shopping

```
utm_source=google
utm_medium=shopping
utm_campaign={campaignid}_{campaign}
utm_content={product}
utm_term={adgroupid}
```

**Exemple:**
```
?utm_source=google&utm_medium=shopping&utm_campaign=12345678_Shopping_Produits&utm_content=robinet_cuisine_chrome&utm_term=98765432
```

---

## Erreurs Fréquentes à Éviter

### 1. Mauvais Champ pour les UTM

**Mauvais:**
- Ajouter les UTM dans "Final URL" → Dupliqué à chaque annonce

**Correct:**
- Ajouter dans "Final URL suffix" → Appliqué automatiquement à toutes les annonces de la campagne

### 2. Oublier le `{keyword}` pour Search Campaigns

**Sans `{keyword}`:**
```
utm_term=fixe  ← Tous les mots-clés apparaissent comme "fixe" dans vos rapports
```

**Avec `{keyword}`:**
```
utm_term=plombier+urgence  ← Vous savez exactement quel mot-clé a converti
```

### 3. Utiliser des Espaces dans les Noms

**Mauvais:**
```
utm_campaign=Lead Gen Plomberie
```

**Dans l'URL devient:**
```
utm_campaign=Lead+Gen+Plomberie
```

**Correct:**
```
utm_campaign=LeadGen_Plomberie
```

### 4. Dupliquer Auto-Tagging et UTM Manuels Sans Coordination

**Problème:**
- Auto-tagging activé: `utm_campaign=Google` (automatique)
- UTM manuel: `utm_campaign=LeadGen_Plomberie`

**Résultat dans Google Analytics:** Conflit de données.

**Solution:** Choisir UNE méthode OU coordonner les deux (voir section "Auto-Tagging + UTM Manuels").

---

## Checklist Post-Configuration

- [ ] Template UTM ajouté à toutes les campagnes actives
- [ ] Paramètres dynamiques `{campaignid}`, `{keyword}` utilisés
- [ ] Noms de campagnes suivent convention (pas d'espaces)
- [ ] Test preview vérifié (variables remplacées)
- [ ] Annonce test cliquée (via Ad Preview tool) → URL contient les UTM corrects
- [ ] Lead test créé dans GHL → Custom Fields remplis
- [ ] Décision prise: Auto-tagging seul OU UTM manuels seul OU les deux
- [ ] Documentation remise au client

---

## Ressources Supplémentaires

**Google Ads Help - ValueTrack Parameters:**
https://support.google.com/google-ads/answer/6305348

**Ad Preview and Diagnosis Tool:**
https://ads.google.com/aw/adpreview

**Guide installation script:** [INSTALLATION.md](INSTALLATION.md)
**Dépannage:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Configuration Google Ads terminée!** Vos publicités trackent maintenant l'attribution complète par mot-clé.
