import { Redis } from 'ioredis';
import type { SimulatorQuota } from '@atline/types';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const MONTHLY_QUOTA = parseInt(process.env.MONTHLY_QUOTA_SECONDS || '7200');

function yearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function quotaKey(userId: string): string {
  return `quota:${userId}:${yearMonth()}`;
}

/**
 * Initialise le quota si absent (premier appel du mois)
 */
async function ensureQuota(userId: string): Promise<void> {
  const key = quotaKey(userId);
  const exists = await redis.exists(key);
  if (!exists) {
    // TTL 35 jours pour couvrir le mois + transition
    await redis.setex(key, 35 * 24 * 3600, MONTHLY_QUOTA);
  }
}

/**
 * Récupère le quota restant
 */
export async function getSimulatorQuota(userId: string): Promise<SimulatorQuota> {
  await ensureQuota(userId);
  const remaining = parseInt((await redis.get(quotaKey(userId))) || '0');
  return {
    used: MONTHLY_QUOTA - remaining,
    remaining,
    monthly: MONTHLY_QUOTA,
    month: yearMonth(),
  };
}

/**
 * Décrémente atomiquement le quota (appelé par le serveur WS)
 * Retourne false si quota insuffisant
 */
export async function decrementQuota(userId: string, seconds: number): Promise<boolean> {
  await ensureQuota(userId);
  const key = quotaKey(userId);
  const remaining = await redis.decrby(key, seconds);
  if (remaining < 0) {
    // Rembourser pour ne pas aller en négatif
    await redis.incrby(key, seconds);
    return false;
  }
  return true;
}

/**
 * Ajoute des secondes (achat heure supplémentaire via Stripe)
 */
export async function addQuota(userId: string, seconds: number): Promise<number> {
  await ensureQuota(userId);
  return redis.incrby(quotaKey(userId), seconds);
}

/**
 * Reset mensuel — appelé par n8n le 1er du mois
 */
export async function resetQuota(userId: string): Promise<void> {
  const key = quotaKey(userId);
  await redis.setex(key, 35 * 24 * 3600, MONTHLY_QUOTA);
}

export { redis };
