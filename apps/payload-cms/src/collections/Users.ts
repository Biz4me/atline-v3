import type { CollectionConfig } from 'payload';

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
      defaultValue: 'distributor',
      label: 'Rôle',
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: 'Distributeur', value: 'distributor' },
        { label: 'Prospect', value: 'prospect' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    // ── Abonnements ──────────────────────────────────────────────────────
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

    // ── MLM ───────────────────────────────────────────────────────────────
    {
      name: 'mlmLevel',
      type: 'number',
      defaultValue: 0,
      label: 'Niveau MLM',
      admin: {
        description: '0 = non activé, 1-7 = niveau selon directs actifs',
        position: 'sidebar',
      },
    },
    {
      name: 'directCount',
      type: 'number',
      defaultValue: 0,
      label: 'Filleuls directs actifs',
      admin: { position: 'sidebar' },
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      label: 'Code de parrainage',
      admin: { position: 'sidebar' },
    },
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      label: 'Parrainé par',
      admin: {
        description: 'Parrain direct de cet utilisateur',
        position: 'sidebar',
      },
    },

    // ── Stripe ────────────────────────────────────────────────────────────
    {
      name: 'stripeCustomerId',
      type: 'text',
      label: 'Stripe Customer ID',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
};
