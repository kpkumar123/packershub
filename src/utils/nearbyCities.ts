// nearbyCities.ts — Haversine distance-based nearby cities utility
// Module 34: Internal Linking via Geographic Proximity

interface City {
  slug: string;
  name: string;
  state: string;
  lat?: number;
  lng?: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearbyCities(
  current: City,
  allCities: City[],
  maxResults = 8,
  maxKm = 300
): City[] {
  if (!current.lat || !current.lng) {
    // Fallback: same-state cities excluding current
    return allCities
      .filter(c => c.state === current.state && c.slug !== current.slug)
      .slice(0, maxResults);
  }

  return allCities
    .filter(c => c.slug !== current.slug && c.lat && c.lng)
    .map(c => ({
      ...c,
      _dist: haversineKm(current.lat!, current.lng!, c.lat!, c.lng!),
    }))
    .filter(c => c._dist <= maxKm)
    .sort((a, b) => a._dist - b._dist)
    .slice(0, maxResults);
}
