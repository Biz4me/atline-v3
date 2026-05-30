export interface PlaceableUser {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'distributor' | 'admin';
  placementDeadline: string;
  effectiveDistributorId: string | null;
  effectiveDistributorName: string | null;
}

export interface PlacementTarget {
  id: string;
  name: string;
  email: string;
  directCount: number;
}

export interface PlacementData {
  placeables: PlaceableUser[];
  targets: PlacementTarget[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlaceable(u: any): PlaceableUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    placementDeadline: u.placementDeadline,
    effectiveDistributorId: u.effectiveDistributor
      ? typeof u.effectiveDistributor === 'object'
        ? u.effectiveDistributor.id
        : u.effectiveDistributor
      : null,
    effectiveDistributorName: u.effectiveDistributor?.name ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTarget(u: any): PlacementTarget {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    directCount: u.directCount ?? 0,
  };
}

/**
 * Récupère les utilisateurs dans la fenêtre de placement du parrain
 * et la liste de ses filleuls distributeurs (cibles possibles).
 */
export async function getPlacementData(userId: string): Promise<PlacementData> {
  const PAYLOAD_URL = process.env.PAYLOAD_API_URL;
  const PAYLOAD_KEY = process.env.PAYLOAD_API_KEY;

  if (!PAYLOAD_URL || !PAYLOAD_KEY) return { placeables: [], targets: [] };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `users API-Key ${PAYLOAD_KEY}`,
  };

  const now = new Date().toISOString();

  try {
    const [placeablesRes, targetsRes] = await Promise.all([
      fetch(
        `${PAYLOAD_URL}/users?where[referredBy][equals]=${userId}&where[placementDeadline][greater_than]=${encodeURIComponent(now)}&depth=1&limit=100`,
        { headers, next: { revalidate: 0 } }
      ),
      fetch(
        `${PAYLOAD_URL}/users?where[referredBy][equals]=${userId}&where[role][equals]=distributor&depth=1&limit=100`,
        { headers, next: { revalidate: 0 } }
      ),
    ]);

    if (!placeablesRes.ok || !targetsRes.ok) return { placeables: [], targets: [] };

    const [placeablesData, targetsData] = await Promise.all([
      placeablesRes.json(),
      targetsRes.json(),
    ]);

    return {
      placeables: (placeablesData.docs ?? []).map(toPlaceable),
      targets: (targetsData.docs ?? []).map(toTarget),
    };
  } catch {
    return { placeables: [], targets: [] };
  }
}
