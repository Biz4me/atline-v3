import type { CollectionConfig, CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload';

// ── Hook : résout effectiveDistributor à la création ─────────────────────────
const resolveEffectiveDistributor: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data;

  // Les admins peuvent créer des comptes sans code parrain (ex: 1er admin)
  const isAdmin = req.user?.role === 'admin';
  const referralCode = data.referralCode_input as string | undefined;

  if (!referralCode) {
    if (!isAdmin) {
      throw new Error('Un code de parrainage est obligatoire pour créer un compte.');
    }
    return data;
  }

  // Trouver le parrain via son referralCode
  const result = await req.payload.find({
    collection: 'users',
    where: { referralCode: { equals: referralCode } },
    limit: 1,
  });

  const parrain = result.docs[0];
  if (!parrain) return data;

  // Lier le parrain direct
  data.referredBy = parrain.id;

  // Résoudre le distributeur effectif
  if (parrain.role === 'distributor') {
    data.effectiveDistributor = parrain.id;
  } else {
    // Le parrain est un client → utiliser son effectiveDistributor
    data.effectiveDistributor = (parrain as { effectiveDistributor?: { id?: number } | number })
      .effectiveDistributor
      ? typeof parrain.effectiveDistributor === 'object'
        ? (parrain.effectiveDistributor as { id: number }).id
        : parrain.effectiveDistributor
      : null;
  }

  return data;
};

// ── Hook : quand un client devient distributeur, transférer ses filleuls ──────
const onRoleChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const becameDistributor =
    previousDoc?.role !== 'distributor' && doc.role === 'distributor';

  if (!becameDistributor) return doc;

  // Tous les filleuls directs dont effectiveDistributor était l'ancien distributeur
  const oldEffectiveDistributorId =
    previousDoc?.effectiveDistributor
      ? typeof previousDoc.effectiveDistributor === 'object'
        ? previousDoc.effectiveDistributor.id
        : previousDoc.effectiveDistributor
      : null;

  // 1. Trouver tous les users référés directement par ce user (referredBy = doc.id)
  const directReferees = await req.payload.find({
    collection: 'users',
    where: { referredBy: { equals: doc.id } },
    limit: 1000,
  });

  // 2. Les mettre à jour → effectiveDistributor = doc.id (le nouveau distributeur)
  await Promise.all(
    directReferees.docs.map((user) =>
      req.payload.update({
        collection: 'users',
        id: user.id,
        data: { effectiveDistributor: doc.id },
      })
    )
  );

  // 3. Recalculer directCount de l'ancien distributeur effectif
  if (oldEffectiveDistributorId) {
    const oldCount = await req.payload.find({
      collection: 'users',
      where: { effectiveDistributor: { equals: oldEffectiveDistributorId } },
      limit: 0,
    });
    await req.payload.update({
      collection: 'users',
      id: oldEffectiveDistributorId,
      data: { directCount: oldCount.totalDocs },
    });
  }

  // 4. directCount du nouveau distributeur = ses filleuls directs transférés
  const newCount = await req.payload.find({
    collection: 'users',
    where: { effectiveDistributor: { equals: doc.id } },
    limit: 0,
  });
  await req.payload.update({
    collection: 'users',
    id: doc.id,
    data: {
      effectiveDistributor: doc.id, // il est son propre distributeur effectif
      directCount: newCount.totalDocs,
    },
  });

  return doc;
};

// ── Hook : màj directCount du distributeur effectif après chaque inscription ──
const updateDistributorCount: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc;

  const effectiveDistributorId = doc.effectiveDistributor
    ? typeof doc.effectiveDistributor === 'object'
      ? doc.effectiveDistributor.id
      : doc.effectiveDistributor
    : null;

  if (!effectiveDistributorId) return doc;

  const count = await req.payload.find({
    collection: 'users',
    where: { effectiveDistributor: { equals: effectiveDistributorId } },
    limit: 0,
  });

  await req.payload.update({
    collection: 'users',
    id: effectiveDistributorId,
    data: { directCount: count.totalDocs },
  });

  return doc;
};

// ── Collection ────────────────────────────────────────────────────────────────
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'hasLicence', 'hasCoach', 'mlmLevel'],
    group: 'Utilisateurs',
  },

  hooks: {
    beforeChange: [resolveEffectiveDistributor],
    afterChange: [onRoleChange, updateDistributorCount],
  },

  fields: [
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
      admin: { position: 'sidebar' },
    },

    // ── Parrainage ────────────────────────────────────────────────────────────
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      label: 'Parrainé par',
      admin: {
        description: 'Parrain direct (client ou distributeur)',
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
        description: 'Distributeur auquel cet utilisateur est réellement rattaché',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      label: 'Code de parrainage',
      admin: { position: 'sidebar' },
    },
    // Champ virtuel utilisé uniquement à l'inscription (non stocké)
    {
      name: 'referralCode_input',
      type: 'text',
      label: 'Code parrain (à l\'inscription)',
      admin: {
        hidden: true,
        description: 'Rempli automatiquement depuis le lien de parrainage',
      },
      virtual: true,
    },

    // ── Abonnements ──────────────────────────────────────────────────────────
    {
      name: 'hasLicence',
      type: 'checkbox',
      defaultValue: false,
      label: 'Licence active',
      admin: { position: 'sidebar' },
    },
    {
      name: 'hasCoach',
      type: 'checkbox',
      defaultValue: false,
      label: 'Coach IA actif',
      admin: { position: 'sidebar' },
    },

    // ── MLM ───────────────────────────────────────────────────────────────────
    {
      name: 'mlmLevel',
      type: 'number',
      defaultValue: 0,
      label: 'Niveau MLM',
      admin: {
        description: '0 = non activé, 1-7 selon directs actifs',
        position: 'sidebar',
      },
    },
    {
      name: 'directCount',
      type: 'number',
      defaultValue: 0,
      label: 'Filleuls directs actifs',
      admin: { position: 'sidebar', readOnly: true },
    },

    // ── Stripe ────────────────────────────────────────────────────────────────
    {
      name: 'stripeCustomerId',
      type: 'text',
      label: 'Stripe Customer ID',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
};
