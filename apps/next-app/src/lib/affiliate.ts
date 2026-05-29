import type { CommissionEntry, NetworkNode } from '@atline/types';

const API = process.env.AFFILIATE_API_URL!;
const KEY = process.env.AFFILIATE_API_KEY!;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${KEY}`,
};

export async function getNetworkStats(userId: string) {
  const res = await fetch(`${API}/affiliates/${userId}/stats`, {
    headers,
    next: { revalidate: 60 }, // cache 1 minute
  });
  return res.json();
}

export async function getNetworkTree(userId: string, depth = 7): Promise<NetworkNode[]> {
  const res = await fetch(`${API}/affiliates/${userId}/tree?depth=${depth}`, {
    headers,
    next: { revalidate: 120 },
  });
  return res.json();
}

export async function getCommissionsSummary(userId: string) {
  const res = await fetch(`${API}/commissions/${userId}/summary`, {
    headers,
    next: { revalidate: 60 },
  });
  return res.json();
}

export async function getCommissionsHistory(
  userId: string,
  month?: string
): Promise<CommissionEntry[]> {
  const url = month
    ? `${API}/commissions/${userId}?month=${month}`
    : `${API}/commissions/${userId}`;
  const res = await fetch(url, { headers, next: { revalidate: 300 } });
  return res.json();
}

export async function getReferralLinks(userId: string) {
  const res = await fetch(`${API}/affiliates/${userId}/links`, {
    headers,
    next: { revalidate: 3600 },
  });
  return res.json();
}
