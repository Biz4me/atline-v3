import type { CollectionConfig } from 'payload';

export const SimulatorSessions: CollectionConfig = {
  slug: 'simulator-sessions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'persona', 'score', 'durationSeconds', 'createdAt'],
    group: 'Coaching',
  },
  access: {
    // Un distributeur ne voit que ses propres sessions
    read: ({ req }) => {
      if (req.user?.collection === 'users' && (req.user as { role?: string }).role === 'admin') {
        return true;
      }
      return { user: { equals: req.user?.id } };
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => {
      if ((req.user as { role?: string } | null)?.role === 'admin') return true;
      return false;
    },
    delete: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Distributeur',
    },
    {
      name: 'persona',
      type: 'select',
      required: true,
      label: 'Persona simulé',
      options: [
        { label: 'Le Curieux', value: 'curious' },
        { label: 'Le Sceptique', value: 'skeptical' },
        { label: 'Le Pressé', value: 'hurried' },
        { label: "L'Hostile", value: 'hostile' },
        { label: 'Le Proche', value: 'close' },
      ],
    },
    {
      name: 'score',
      type: 'number',
      label: 'Score (0-100)',
      min: 0,
      max: 100,
    },
    {
      name: 'durationSeconds',
      type: 'number',
      label: 'Durée (secondes)',
    },
    {
      name: 'transcript',
      type: 'json',
      label: 'Transcription complète',
      admin: {
        description: 'Array de { role, content, timestamp }',
      },
    },
    {
      name: 'debrief',
      type: 'json',
      label: 'Débrief OpenClaw',
      admin: {
        description: 'JSON retourné par Dify → OpenClaw',
      },
    },
    {
      name: 'openClawExecuted',
      type: 'checkbox',
      defaultValue: false,
      label: 'Actions OpenClaw exécutées',
      admin: { position: 'sidebar' },
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
  ],
  timestamps: true,
};
