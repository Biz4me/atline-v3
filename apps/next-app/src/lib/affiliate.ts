import type { CommissionEntry, NetworkNode } from '@atline/types';

const API = process.env.AFFILIATE_API_URL;
const KEY = process.env.AFFILIATE_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${KEY}`,
};

// ── Fallbacks (tant que l'AMS n'est pas déployé) ────────────────────────────

const FALLBACK_STATS = {
  totalCount: 0,
  activeCount: 0,
  newThisMonth: 0,
};

const FALLBACK_COMMISSIONS = {
  thisMonth: 0,
  lastMonth: 0,
  trend: 0,
  total: 0,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function safeFetch<T>(url: string, options: RequestInit, fallback: T): Promise<T> {
  if (!API || !KEY) return fallback;
  try {
    const res = await fetch(url, options);
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    return fallback;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getNetworkStats(userId: string) {
  return safeFetch(
    `${API}/affiliates/${userId}/stats`,
    { headers, next: { revalidate: 60 } },
    FALLBACK_STATS
  );
}

export async function getNetworkTree(userId: string, depth = 7): Promise<NetworkNode[]> {
  return safeFetch(
    `${API}/affiliates/${userId}/tree?depth=${depth}`,
    { headers, next: { revalidate: 120 } },
    []
  );
}

export async function getCommissionsSummary(userId: string) {
  return safeFetch(
    `${API}/commissions/${userId}/summary`,
    { headers, next: { revalidate: 60 } },
    FALLBACK_COMMISSIONS
  );
}

export async function getCommissionsHistory(
  userId: string,
  month?: string
): Promise<CommissionEntry[]> {
  const url = month
    ? `${API}/commissions/${userId}?month=${month}`
    : `${API}/commissions/${userId}`;
  return safeFetch(url, { headers, next: { revalidate: 300 } }, []);
}

export async function getReferralLinks(userId: string) {
  return safeFetch(
    `${API}/affiliates/${userId}/links`,
    { headers, next: { revalidate: 3600 } },
    { referral: null, links: [] }
  );
}
