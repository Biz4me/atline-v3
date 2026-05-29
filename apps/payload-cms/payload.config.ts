import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';

import { Users } from './src/collections/Users.js';
import { SimulatorSessions } from './src/collections/SimulatorSessions.js';
import { Formations } from './src/collections/Formations.js';
import { Prospects } from './src/collections/Prospects.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Atline Admin',
    },
  },

  collections: [Users, SimulatorSessions, Formations, Prospects],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Pour la création initiale du schéma : DB_PUSH=true
    // En production après init : supprimer cette ligne ou mettre false
    push: process.env.DB_PUSH === 'true',
  }),

  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3002',

  cors: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://app.atline.online',
  ],

  csrf: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://app.atline.online',
  ],
});
