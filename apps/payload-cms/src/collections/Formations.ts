import type { CollectionConfig } from 'payload';

export const Formations: CollectionConfig = {
  slug: 'formations',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'level', 'durationMinutes', 'requiredRole'],
    group: 'Contenu',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titre',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
      label: 'Slug URL',
      admin: {
        description: 'ex: prospection-debutant',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Catégorie',
      options: [
        { label: 'Prospection', value: 'prospection' },
        { label: 'Traitement objections', value: 'objections' },
        { label: 'Closing', value: 'closing' },
        { label: 'MLM & réseau', value: 'mlm' },
        { label: 'Mindset', value: 'mindset' },
        { label: 'Social media', value: 'social' },
      ],
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      label: 'Niveau',
      options: [
        { label: 'Débutant', value: 'beginner' },
        { label: 'Intermédiaire', value: 'intermediate' },
        { label: 'Avancé', value: 'advanced' },
      ],
    },
    {
      name: 'durationMinutes',
      type: 'number',
      label: 'Durée (minutes)',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Contenu',
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'URL vidéo (Vimeo/YouTube)',
    },
    {
      name: 'requiredRole',
      type: 'select',
      defaultValue: 'distributor',
      label: 'Accès requis',
      options: [
        { label: 'Tous', value: 'all' },
        { label: 'Distributeur (licence)', value: 'distributor' },
        { label: 'Coach IA', value: 'coach' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Ordre d\'affichage',
      admin: { position: 'sidebar' },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      label: 'Publié',
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
};
