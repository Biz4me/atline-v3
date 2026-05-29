import type { CollectionConfig } from 'payload';

export const Prospects: CollectionConfig = {
  slug: 'prospects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'status', 'owner', 'createdAt'],
    group: 'CRM',
  },
  access: {
    // Chaque distributeur ne voit que ses propres prospects
    read: ({ req }) => {
      if ((req.user as { role?: string } | null)?.role === 'admin') return true;
      return { owner: { equals: req.user?.id } };
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => {
      if ((req.user as { role?: string } | null)?.role === 'admin') return true;
      return { owner: { equals: req.user?.id } };
    },
    delete: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Distributeur propriétaire',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Rempli automatiquement',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom complet',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Téléphone',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      label: 'Statut',
      options: [
        { label: 'Nouveau', value: 'new' },
        { label: 'Contacté', value: 'contacted' },
        { label: 'Intéressé', value: 'interested' },
        { label: 'RDV planifié', value: 'meeting' },
        { label: 'Client', value: 'client' },
        { label: 'Refus', value: 'refused' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'source',
      type: 'select',
      label: 'Source',
      options: [
        { label: 'Lien de parrainage', value: 'referral' },
        { label: 'Réseaux sociaux', value: 'social' },
        { label: 'Bouche à oreille', value: 'word_of_mouth' },
        { label: 'Événement', value: 'event' },
        { label: 'Autre', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
    },
    {
      name: 'nextFollowUp',
      type: 'date',
      label: 'Prochain suivi',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'calEventId',
      type: 'text',
      label: 'Cal.com event ID',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Auto-assigne le propriétaire à la création
        if (operation === 'create' && req.user) {
          data.owner = req.user.id;
        }
        return data;
      },
    ],
  },
  timestamps: true,
};
