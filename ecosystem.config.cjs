module.exports = {
  apps: [
    // ── Distributeur Next.js (port 3000) ─────────────────────────────────
    {
      name: 'atline-app',
      cwd: '/opt/atline/atline-v3/apps/next-app',
      script: 'npm',
      args: 'start',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        AUTH_TRUST_HOST: '1',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },

    // ── Payload CMS Next.js (port 3002) ───────────────────────────────────
    {
      name: 'atline-payload',
      cwd: '/opt/atline/atline-v3/apps/payload-cms',
      script: 'npm',
      args: 'start',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
