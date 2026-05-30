import type { CollectionConfig, CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload';
import { randomBytes } from 'node:crypto';

// ── Calcul automatique du niveau MLM ─────────────────────────────────────────
function computeMlmLevel(directCount: number): number {
  if (directCount >= 100) return 7;
  if (directCount >= 50)  return 6;
  if (directCount >= 20)  return 5;
  if (directCount >= 10)  return 4;
  if (directCount >= 5)   return 3;
  if (directCount >= 2)   return 2;
  if (directCount >= 1)   return 1;
  return 0;
}

// ── Hook 1 : force le rôle client pour toute création non authentifiée ────────
// Sécurité : empêche qu'une requête publique crée un admin ou un distributeur
const enforceClientRole: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data;
  if (!req.user) {
    data.role     = 'client';
    data.hasLicence = false;
    data.hasCoach   = false;
    data.mlmLevel   = 0;
  }
  return data;
};

// ── Hook 2 : génère un referralCode unique (ex : "A3F7K2M9") ─────────────────
// Indispensable : sans ce code, l'utilisateur ne peut pas créer de liens d'invitation
const generateReferralCode: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create' || data.referralCode) return data;
  data.referralCode = randomBytes(4).toString('hex').toUpperCase();
  return data;
};

// ── Hook 3 : génère un inviteToken opaque (ex : "aB3kR9mX") ──────────────────
const generateInviteToken: CollectionBeforeChangeHook = async ({ data, operation, originalDoc }) => {
  if (operation === 'create' && !data.inviteToken) {
    data.inviteToken = randomBytes(6).toString('base64url');
  }
  // Backfill : si un compte existant n'a pas de token, en générer un à la prochaine sauvegarde
  if (operation === 'update' && !originalDoc?.inviteToken && !data.inviteToken) {
    data.inviteToken = randomBytes(6).toString('base64url');
  }
  return data;
};

// ── Hook 4 : fenêtre de placement J+30 ───────────────────────────────────────
const setPlacementDeadline: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create') return data;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  data.placementDeadline = deadline.toISOString();
  return data;
};

// ── Hook 5 : résout le parrain et le distributeur effectif ───────────────────
// Ne bloque plus si pas de code parrain (clients simples ou pending_placement)
const resolveEffectiveDistributor: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data;

  const referralCode = data.referralCode_input as string | undefined;

  // Pas de code parrain → client simple ou distributeur en attente (pending_placement)
  if (!referralCode) return data;

  // Trouver le parrain via son referralCode
  const result = await req.payload.find({
    collection: 'users',
    where: { referralCode: { equals: referralCode } },
    limit: 1,
  });

  const parrain = result.docs[0];
  if (!parrain) return data; // Code invalide → on ignore silencieusement

  data.referredBy = parrain.id;

  // Distributeur effectif = le parrain s'il est distributeur, sinon son propre effectiveDistributor
  if (parrain.role === 'distributor') {
    data.effectiveDistributor = parrain.id;
  } else {
    const parentEffective = parrain.effectiveDistributor;
    data.effectiveDistributor = parentEffective
      ? typeof parentEffective === 'object'
        ? (parentEffective as { id: number }).id
        : parentEffective
      : null;
  }

  return data;
};

// ── Hook afterChange : quand client → distributeur, transférer ses filleuls ───
const onRoleChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const becameDistributor = previousDoc?.role !== 'distributor' && doc.role === 'distributor';
  if (!becameDistributor) return doc;

  const oldDistId = previousDoc?.effectiveDistributor
    ? typeof previousDoc.effectiveDistributor === 'object'
      ? previousDoc.effectiveDistributor.id
      : previousDoc.effectiveDistributor
    : null;

  // Transférer tous les filleuls directs vers le nouveau distributeur
  const directReferees = await req.payload.find({
    collection: 'users',
    where: { referredBy: { equals: doc.id } },
    limit: 1000,
  });

  await Promise.all(
    directReferees.docs.map((user) =>
      req.payload.update({
        collection: 'users',
        id: user.id,
        data: { effectiveDistributor: doc.id },
      })
    )
  );

  // Recalculer l'ancien distributeur effectif
  if (oldDistId) {
    const oldRes = await req.payload.find({
      collection: 'users',
      where: { effectiveDistributor: { equals: oldDistId } },
      limit: 0,
    });
    const oldCount = oldRes.totalDocs;
    await req.payload.update({
      collection: 'users',
      id: oldDistId,
      data: { directCount: oldCount, mlmLevel: computeMlmLevel(oldCount) },
    });
  }

  // Recalculer le nouveau distributeur
  const newRes = await req.payload.find({
    collection: 'users',
    where: { effectiveDistributor: { equals: doc.id } },
    limit: 0,
  });
  const newCount = newRes.totalDocs;
  await req.payload.update({
    collection: 'users',
    id: doc.id,
    data: {
      effectiveDistributor: doc.id,
      directCount: newCount,
      mlmLevel: computeMlmLevel(newCount),
    },
  });

  return doc;
};

// ── Hook afterChange : màj directCount + mlmLevel après chaque inscription ────
const updateDistributorCount: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc;

  const distId = doc.effectiveDistributor
    ? typeof doc.effectiveDistributor === 'object'
      ? doc.effectiveDistributor.id
      : doc.effectiveDistributor
    : null;

  if (!distId) return doc;

  const countRes = await req.payload.find({
    collection: 'users',
    where: { effectiveDistributor: { equals: distId } },
    limit: 0,
  });

  const count = countRes.totalDocs;
  await req.payload.update({
    collection: 'users',
    id: distId,
    data: { directCount: count, mlmLevel: computeMlmLevel(count) },
  });

  return doc;
};

// ── Collection Users ──────────────────────────────────────────────────────────
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'hasLicence', 'pendingPlacement', 'createdAt'],
    group: 'Utilisateurs',
    description: 'Admins, distributeurs et clients de la plateforme Atline',
  },

  access: {
    create: () => true, // Inscription publique — enforceClientRole sécurise le rôle
    read: ({ req }) => {
      if ((req?.user as { role?: string } | null)?.role === 'admin') return true;
      return req?.user ? { id: { equals: req.user.id } } : false;
    },
    update: ({ req }) => {
      if ((req?.user as { role?: string } | null)?.role === 'admin') return true;
      return req?.user ? { id: { equals: req.user.id } } : false;
    },
    delete: ({ req }) => (req?.user as { role?: string } | null)?.role === 'admin',
  },

  hooks: {
    beforeChange: [
      enforceClientRole,         // 1. Sécurité rôle
      generateReferralCode,      // 2. Code parrainage unique
      generateInviteToken,       // 3. Token lien invitation
      setPlacementDeadline,      // 4. Fenêtre placement J+30
      resolveEffectiveDistributor, // 5. Résolution parrain
    ],
    afterChange: [
      onRoleChange,              // Promotion client → distributeur
      updateDistributorCount,    // directCount + mlmLevel auto
    ],
  },

  fields: [
    // ── Identité ─────────────────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom complet',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'client',
      label: 'Rôle',
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: 'Distributeur', value: 'distributor' },
        { label: 'Client', value: 'client' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Le rôle "distributeur" est attribué après paiement de la licence (Stripe webhook)',
      },
    },

    // ── Parrainage & réseau ───────────────────────────────────────────────────
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      label: 'Parrainé par',
      admin: {
        description: 'Parrain direct (résolu automatiquement à l\'inscription)',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'effectiveDistributor',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      label: 'Distributeur effectif',
      admin: {
        description: 'Distributeur auquel cet utilisateur est rattaché pour les commissions MLM',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      label: 'Code de parrainage',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Généré automatiquement — utilisé dans les liens d\'invitation',
      },
    },
    {
      name: 'inviteToken',
      type: 'text',
      unique: true,
      label: 'Token invitation',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'URL partageable : app.atline.online/invite/[token]',
      },
    },
    {
      name: 'placementDeadline',
      type: 'date',
      label: 'Placement possible jusqu\'au',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Le parrain peut placer ce membre dans son réseau jusqu\'à cette date (J+30)',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'd MMM yyyy HH:mm',
        },
      },
    },
    {
      name: 'pendingPlacement',
      type: 'checkbox',
      defaultValue: false,
      label: '⏳ En attente d\'un parrain',
      admin: {
        position: 'sidebar',
        description: 'Cochez pour les distributeurs sans parrain → à assigner via le super-placement Atline',
      },
    },

    // Champ virtuel non stocké — passé à la création via le formulaire
    {
      name: 'referralCode_input',
      type: 'text',
      label: 'Code parrain (formulaire d\'inscription)',
      admin: {
        hidden: true,
        description: 'Transmis depuis le lien de parrainage — non stocké en base',
      },
      virtual: true,
    },

    // ── Abonnements ──────────────────────────────────────────────────────────
    {
      name: 'hasLicence',
      type: 'checkbox',
      defaultValue: false,
      label: 'Licence active',
      admin: {
        position: 'sidebar',
        description: 'Donne accès au réseau MLM et aux commissions (99€/an via Stripe)',
      },
    },
    {
      name: 'hasCoach',
      type: 'checkbox',
      defaultValue: false,
      label: 'Coach IA actif',
      admin: {
        position: 'sidebar',
        description: 'Simulateur vocal + formations IA (39€/mois via Stripe)',
      },
    },

    // ── MLM ───────────────────────────────────────────────────────────────────
    {
      name: 'mlmLevel',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 7,
      label: 'Niveau MLM (0-7)',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Calculé automatiquement selon le nombre de filleuls directs actifs',
      },
    },
    {
      name: 'directCount',
      type: 'number',
      defaultValue: 0,
      label: 'Filleuls directs actifs',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Mis à jour automatiquement à chaque inscription ou placement',
      },
    },

    // ── Stripe ────────────────────────────────────────────────────────────────
    {
      name: 'stripeCustomerId',
      type: 'text',
      label: 'Stripe Customer ID',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Rempli automatiquement lors du premier paiement Stripe',
      },
    },
  ],
};
