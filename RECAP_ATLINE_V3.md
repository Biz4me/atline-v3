# ATLINE V3 — Récapitulatif complet
> Mis à jour : 29 mai 2026

## 1. Vue d'ensemble

Atline V3 est un SaaS MLM IA déployé en monorepo pnpm sur VPS Hostinger.

| Composant | Technologie | Port | URL production |
|---|---|---|---|
| **App principale** | Next.js 15 + NextAuth v5 | 3000 | https://app.atline.online |
| **Payload CMS** | Payload v3 + Next.js 15 | 3002 | https://payload.atline.online |
| **PostgreSQL** | PostgreSQL 16 | 5432 | local VPS uniquement |
| **WS Server** | Node.js (Sprint 3) | 3001 | wss://ws.atline.online *(à déployer)* |

---

## 2. Infrastructure VPS

| Paramètre | Valeur |
|---|---|
| **Provider** | Hostinger |
| **IP** | 76.13.46.73 |
| **Hostname** | srv1651221.hstgr.cloud |
| **SSH** | `ssh root@76.13.46.73` |
| **Mot de passe SSH** | `QiJ.MXJ;n?LY6e6p` |
| **SSH hostkey** | `SHA256:Cy+n1H1jy6Ht+v3/ypLUtt25D6n2VKJzvYg7Aw36Nqc` |
| **OS** | Ubuntu 22.04 |
| **Process manager** | PM2 |
| **Reverse proxy** | Nginx |

### Chemins VPS
```
/opt/atline/apps/atline-v3/          ← repo cloné (git pull ici)
/opt/atline/apps/atline-v3/apps/next-app/
/opt/atline/apps/atline-v3/apps/payload-cms/
```

### PM2 — ecosystem.config.cjs
```javascript
module.exports = {
  apps: [
    {
      name: 'atline-app',
      cwd: '/opt/atline/apps/atline-v3/apps/next-app',
      script: 'npm', args: 'start',
      env: { NODE_ENV: 'production', PORT: '3000', AUTH_TRUST_HOST: '1' },
    },
    {
      name: 'atline-payload',
      cwd: '/opt/atline/apps/atline-v3/apps/payload-cms',
      script: 'npm', args: 'start',
      env: { NODE_ENV: 'production', PORT: '3002' },
    },
  ],
};
```

### Commandes PM2
```bash
pm2 list                             # état des process
pm2 logs atline-app --lines 50       # logs next-app
pm2 logs atline-payload --lines 50   # logs payload-cms
pm2 restart atline-app
pm2 restart atline-payload
```

### Déploiement VPS
```bash
cd /opt/atline/apps/atline-v3
git pull
pnpm install --frozen-lockfile

# next-app
cd apps/next-app && pnpm build
# payload-cms
cd ../payload-cms && pnpm build

# Migrations si schéma changé
cd apps/payload-cms
npx payload migrate:create --name <nom>
npx payload migrate

pm2 restart all
```

---

## 3. Repo GitHub

| Paramètre | Valeur |
|---|---|
| **Repo** | https://github.com/Biz4me/atline-v3 |
| **Branche principale** | `main` |
| **Monorepo** | pnpm workspaces |
| **Node requis** | >= 20.9.0 |

### Structure du monorepo
```
atline-v3/
├── apps/
│   ├── next-app/          ← App Next.js (port 3000)
│   └── payload-cms/       ← Payload CMS (port 3002)
├── packages/
│   └── types/             ← Types TypeScript partagés (@atline/types)
├── ecosystem.config.cjs   ← PM2 config
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. Variables d'environnement

### `apps/next-app/.env` (VPS — NON dans le repo)
```env
# NextAuth v5
NEXTAUTH_SECRET=<secret 32+ chars>
AUTH_TRUST_HOST=1

# Payload
PAYLOAD_API_URL=http://localhost:3002/api
PAYLOAD_API_KEY=1288e9373d4ca7abf3a153792bc3bbe0b59a81977c1e1143afd22f675ef3b410

# URLs
NEXT_PUBLIC_APP_URL=https://app.atline.online

# Affiliate (à déployer)
AFFILIATE_API_URL=http://localhost:3003/api
AFFILIATE_API_KEY=<à générer>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_LICENCE_YEARLY=price_...
STRIPE_PRICE_COACH_MONTHLY=price_...
STRIPE_PRICE_EXTRA_HOUR=price_...

# Simulateur Vocal (Sprint 3)
DEEPGRAM_API_KEY=3d8ca1c78699f7833c1d057649472b30e09757b9
GROQ_API_KEY=<à obtenir>
CARTESIA_API_KEY=<à obtenir>

# Dify (Sprint 2)
DIFY_API_URL=http://localhost:5001/v1
DIFY_CHAT_KEY=<à générer>
DIFY_DEBRIEF_KEY=<à générer>

# WebSocket (Sprint 3)
NEXT_PUBLIC_WS_URL=wss://ws.atline.online

# Quota simulateur
MONTHLY_QUOTA_SECONDS=7200
REDIS_URL=redis://localhost:6379
```

### `apps/payload-cms/.env` (VPS — NON dans le repo)
```env
DATABASE_URL=postgresql://atline:Atline2026!Secure@localhost:5432/atline
PAYLOAD_SECRET=<secret 32+ chars — générer avec: openssl rand -base64 32>
PAYLOAD_PUBLIC_SERVER_URL=https://payload.atline.online
NEXT_PUBLIC_APP_URL=https://app.atline.online
PORT=3002
DB_PUSH=false   # migrations manuelles en prod
```

---

## 5. Authentification

### NextAuth v5 (beta.31)
- **Provider** : Credentials (email + mot de passe)
- **Backend** : `POST /api/users/login` sur Payload CMS
- **Stratégie session** : JWT (30 jours)
- **Fichiers clés** :
  - `apps/next-app/src/lib/auth.ts` — config NextAuth
  - `apps/next-app/src/app/api/auth/[...nextauth]/route.ts` — route handler
  - `apps/next-app/src/middleware.ts` — protection des routes

### Routes publiques (middleware)
- `/login`
- `/register` ← nouveau (parrainage)
- `/api/auth/**`
- `/api/register` ← nouveau (parrainage)
- `/_next/**`, `/favicon.ico`, `/api/webhooks/**`

### Session JWT — champs disponibles (`session.user.*`)
```typescript
id: string
email: string
name: string
role: 'admin' | 'distributor' | 'client'
hasLicence: boolean
hasCoach: boolean
mlmLevel: number        // 0-7
directCount: number
referralCode: string
```

---

## 6. Payload CMS

### Configuration
- **Version** : 3.40.0 (ESM `"type": "module"` OBLIGATOIRE)
- **DB adapter** : @payloadcms/db-postgres
- **Admin URL** : https://payload.atline.online/admin
- **API URL** : https://payload.atline.online/api

### Collections
| Slug | Description |
|---|---|
| `users` | Utilisateurs (auth + MLM + parrainage) |
| `simulator-sessions` | Sessions simulateur vocal |
| `formations` | Catalogue formations |
| `prospects` | CRM prospects (par distributeur) |

### Users — Champs principaux
| Champ | Type | Notes |
|---|---|---|
| `email` | text | identifiant auth (built-in Payload) |
| `name` | text | Nom complet |
| `role` | select | `admin` / `distributor` / `client` (défaut: client) |
| `referralCode` | text unique | Code de parrainage de cet utilisateur |
| `referredBy` | relationship → users | Parrain direct (readOnly) |
| `effectiveDistributor` | relationship → users | Distributeur auquel l'user est rattaché (readOnly) |
| `referralCode_input` | text virtual | Code saisi à l'inscription (non stocké) |
| `hasLicence` | checkbox | Licence active |
| `hasCoach` | checkbox | Coach IA actif |
| `mlmLevel` | number | Niveau MLM 0-7 |
| `directCount` | number | Filleuls directs actifs (readOnly) |
| `stripeCustomerId` | text | ID Stripe |

### Users — Hooks
| Hook | Déclencheur | Action |
|---|---|---|
| `resolveEffectiveDistributor` | beforeChange (create) | Résout `referredBy` + `effectiveDistributor` via `referralCode_input` ; rejette si pas de code (sauf admin) |
| `onRoleChange` | afterChange | Quand client → distributeur : transfère les filleuls directs, recalcule `directCount` |
| `updateDistributorCount` | afterChange (create) | Incrémente `directCount` du distributeur effectif |

### Migrations (prod)
```
apps/payload-cms/src/migrations/
├── 20260529_202003.ts   ← schéma initial (toutes les tables)
├── 20260529_202327.ts   ← ajoute enableAPIKey/apiKey sur users
└── index.ts             ← import des deux migrations
```

### API key Payload (pour next-app)
```
1288e9373d4ca7abf3a153792bc3bbe0b59a81977c1e1143afd22f675ef3b410
```
Utilisée dans les headers : `Authorization: users API-Key <clé>`

---

## 7. Système de parrainage (MLM)

### Règle métier
- **Personne ne peut créer de compte sans code parrain** (sauf admins créés manuellement dans Payload)
- Le parrain peut être un **distributeur OU un client** (n'importe qui avec un `referralCode`)
- `effectiveDistributor` = distributeur le plus proche dans la chaîne ascendante

### Résolution de l'effectiveDistributor
```
Nouveau user → parrain est distributeur → effectiveDistributor = parrain
Nouveau user → parrain est client       → effectiveDistributor = parrain.effectiveDistributor
```

### Client → Distributeur (upgrade)
Quand un client passe au rôle `distributor` (Payload admin) :
1. Tous ses filleuls directs (`referredBy = lui`) reçoivent `effectiveDistributor = lui`
2. L'ancien `effectiveDistributor` recalcule son `directCount`
3. Le nouveau distributeur calcule son propre `directCount`
4. Il devient son propre `effectiveDistributor`

### Flow d'inscription
```
Parrain partage → https://app.atline.online/register?ref=CODE
                         ↓
          Page /register valide le code (appel Payload API key)
                         ↓
          Formulaire nom / email / mot de passe
                         ↓
          POST /api/register → Payload POST /api/users
          { referralCode_input: CODE }
                         ↓
          Hook Payload résout effectiveDistributor
                         ↓
          Auto-login via NextAuth → /dashboard
```

### Fichiers concernés
```
apps/next-app/src/app/(auth)/register/page.tsx    ← page d'inscription
apps/next-app/src/app/api/register/route.ts       ← proxy vers Payload
apps/next-app/src/components/auth/RegisterForm.tsx ← formulaire client
apps/next-app/src/components/network/ReferralLinkCard.tsx ← copie lien
apps/next-app/src/app/(app)/network/page.tsx      ← affiche le lien parrainage
apps/payload-cms/src/collections/Users.ts         ← hooks + champs
```

---

## 8. Pages next-app

### Routes auth (publiques)
| URL | Fichier | Description |
|---|---|---|
| `/login` | `(auth)/login/page.tsx` | Connexion |
| `/register?ref=CODE` | `(auth)/register/page.tsx` | Inscription via lien parrainage |

### Routes app (protégées)
| URL | Fichier | Description |
|---|---|---|
| `/dashboard` | `(app)/dashboard/page.tsx` | Vue synthèse + stats |
| `/network` | `(app)/network/page.tsx` | Arbre réseau + lien parrainage |

### Routes API (next-app)
| Endpoint | Méthode | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/register` | POST | Inscription (proxy Payload) |
| `/api/simulator/session` | POST | Démarrer session simulateur |
| `/api/simulator/debrief` | POST | Générer débrief session |
| `/api/webhooks/stripe` | POST | Webhook Stripe |

---

## 9. Types partagés (`@atline/types`)

Fichier : `packages/types/src/index.ts`

```typescript
UserRole = 'distributor' | 'client' | 'admin'
AtlineUser { id, email, name, role, hasLicence, hasCoach, referralCode,
             sponsorId?, mlmLevel, directCount, createdAt }
NetworkNode { id, userId, name, email, level, isActive, joinedAt,
              products, monthlyCommission, children? }
CommissionEntry { id, fromUserId, fromUserName, productId, productName,
                  amount, level, month, status, createdAt }
SimulatorSession, SimulatorDebrief, SimulatorQuota
Subscription, Prospect
WsMessage
```

---

## 10. Affiliate API (à déployer — Sprint 2/3)

Les fonctions dans `apps/next-app/src/lib/affiliate.ts` sont en mode **fallback** tant que le service n'est pas déployé (retournent des zéros sans crasher).

| Fonction | Endpoint attendu |
|---|---|
| `getNetworkStats(userId)` | `GET /affiliates/:id/stats` |
| `getNetworkTree(userId, depth)` | `GET /affiliates/:id/tree?depth=N` |
| `getCommissionsSummary(userId)` | `GET /commissions/:id/summary` |
| `getCommissionsHistory(userId, month?)` | `GET /commissions/:id[?month=YYYY-MM]` |
| `getReferralLinks(userId)` | `GET /affiliates/:id/links` |

Variables requises quand déployé :
```
AFFILIATE_API_URL=http://localhost:3003/api
AFFILIATE_API_KEY=<à générer>
```

---

## 11. Sprints restants

### Sprint 2 — Infrastructure services
- [ ] **n8n** : automatisations (welcome email, rappels, alertes MLM)
- [ ] **Dify** : RAG pour Atlas coach + débrief simulateur
- [ ] **Authentik** : SSO pour n8n / Dify / Portainer
- [ ] **AMS** : Affiliate Management System (API port 3003)
- [ ] **Redis** : quota simulateur (sessions WS)
- [ ] **Stripe** : webhooks live, abonnements licence + coach

### Sprint 3 — Simulateur vocal + Coach IA
- [ ] **ws-server** (`apps/ws-server`) : WebSocket Deepgram STT + Groq LLM + Cartesia TTS
- [ ] **Page /coach** : interface simulateur vocal
- [ ] **Page /commissions** : historique + récapitulatif commissions
- [ ] **Page /catalogue** : offres et abonnements
- [ ] **Page /settings** : paramètres compte

### Sprint 4 — MLM avancé
- [ ] **Génération referralCode** : automatique à la création (UUID court, unique)
- [ ] **Calcul mlmLevel** : basé sur `directCount` actifs (tiers 1→7)
- [ ] **Dashboard commissions** : calcul en temps réel depuis AMS
- [ ] **Page /network** : arbre interactif avec données réelles AMS

---

## 12. Nginx (résumé vhosts)

```nginx
# app.atline.online → next-app :3000
server {
  listen 443 ssl;
  server_name app.atline.online;
  location / { proxy_pass http://localhost:3000; }
}

# payload.atline.online → payload-cms :3002
server {
  listen 443 ssl;
  server_name payload.atline.online;
  location / { proxy_pass http://localhost:3002; }
}
```

---

## 13. Dépendances clés

| Package | Version | Rôle |
|---|---|---|
| `next` | 15.3.0 | Framework React |
| `payload` | 3.40.0 | Headless CMS + Auth |
| `next-auth` | 5.0.0-beta.31 | Auth (JWT) |
| `@payloadcms/db-postgres` | 3.40.0 | DB adapter |
| `@payloadcms/richtext-lexical` | 3.40.0 | Rich text |
| `react` | 19.1.0 | UI |
| `tailwindcss` | 4.x | CSS |
| `lucide-react` | latest | Icônes |
| `pnpm` | 9+ | Package manager |
| `typescript` | 5.8+ | Types |

---

## 14. Pièges connus / gotchas

1. **`"type": "module"` OBLIGATOIRE** dans `payload-cms/package.json` — sans ça, les migrations plantent
2. **`importMap.js` doit être dans `admin/importMap.js`** (pas dans `(payload)/importMap.js`)
3. **`(payload)/layout.tsx` doit utiliser `RootLayout` + `handleServerFunctions`** — sinon crash `Cannot destructure property 'config'`
4. **`extensionAlias` dans webpack** — ne pas supprimer, c'est dans le template officiel Payload
5. **`devBundleServerPackages: false`** dans `withPayload` — également requis
6. **`AUTH_TRUST_HOST=1`** requis en prod derrière Nginx (NextAuth v5)
7. **Affiliate API fallback** — `safeFetch` retourne des zéros si `AFFILIATE_API_URL` non défini, jamais de crash
8. **Migrations prod** : créer avec `payload migrate:create`, appliquer avec `payload migrate`, copier les fichiers en local et committer
9. **Pas de `git push` depuis VPS** (pas de credentials GitHub) — toujours pousser depuis Windows local
