// serviceAreaSlug.ts — bridges cities.json slugs to
// src/data/service-areas/all-100-cities.json slugs.
//
// The two datasets were built independently and 13 Karnataka/Tamil
// Nadu/Kerala cities use different slugs for the same place — usually
// the official renamed form vs. the older common name
// (e.g. cities.json's "bangalore" vs. the areas file's "bengaluru").
// This map resolves those so <ServiceAreas> finds the right entry.
//
// Corrected in v10.7.17: an earlier version of this comment claimed 14
// more cities (Srikakulam, Bhimavaram, Secunderabad, Medak, Bhongir,
// Jangaon, Kumbakonam, Wayanad, Ernakulam, Munnar, Varkala, Changanassery,
// Kolar, Chitradurga) had no counterpart in the areas file. That was
// stale — area data was added for all of them under their existing
// cities.json slugs (no alias needed), so <ServiceAreas> now resolves
// and renders for all 100 cities. Verified by direct slug lookup against
// src/data/service-areas/all-100-cities.json.

const SERVICE_AREA_SLUG_ALIASES: Record<string, string> = {
  bangalore: 'bengaluru',
  mysore: 'mysuru',
  hubli: 'hubballi-dharwad',
  mangalore: 'mangaluru',
  belgaum: 'belagavi',
  gulbarga: 'kalaburagi',
  bellary: 'ballari',
  bijapur: 'vijayapura',
  shimoga: 'shivamogga',
  tumkur: 'tumakuru',
  hospet: 'hosapete',
  udhagamandalam: 'ooty',
  idukki: 'thodupuzha',
};

export function resolveServiceAreaSlug(citySlug: string): string {
  return SERVICE_AREA_SLUG_ALIASES[citySlug] ?? citySlug;
}
