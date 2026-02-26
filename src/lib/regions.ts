/**
 * Namibia’s 14 administrative regions – single source of truth.
 * Used for filters, dropdowns, validation, and reports across Ketchup Portals.
 * @see https://en.wikipedia.org/wiki/Regions_of_Namibia
 */

/** Official 14 regions (value for APIs/URLs; ǁKaras stored as "Karas" for ASCII safety). */
export const NAMIBIA_REGION_CODES = [
  'Erongo',
  'Hardap',
  'Karas',       // ǁKaras
  'Kavango East',
  'Kavango West',
  'Khomas',
  'Kunene',
  'Ohangwena',
  'Omaheke',
  'Omusati',
  'Oshana',
  'Oshikoto',
  'Otjozondjupa',
  'Zambezi',
] as const;

export type NamibiaRegionCode = (typeof NAMIBIA_REGION_CODES)[number];

/** Display labels (ǁKaras shown with official spelling). */
export const REGION_LABELS: Record<NamibiaRegionCode, string> = {
  Erongo: 'Erongo',
  Hardap: 'Hardap',
  Karas: 'ǁKaras',
  'Kavango East': 'Kavango East',
  'Kavango West': 'Kavango West',
  Khomas: 'Khomas',
  Kunene: 'Kunene',
  Ohangwena: 'Ohangwena',
  Omaheke: 'Omaheke',
  Omusati: 'Omusati',
  Oshana: 'Oshana',
  Oshikoto: 'Oshikoto',
  Otjozondjupa: 'Otjozondjupa',
  Zambezi: 'Zambezi',
};

/** All 14 regions as { value, label } for selects (sorted by label). */
export const NAMIBIA_REGIONS = NAMIBIA_REGION_CODES.map((code) => ({
  value: code,
  label: REGION_LABELS[code],
})).sort((a, b) => a.label.localeCompare(b.label));

/** Options for region filter dropdowns: "All regions" + 14 regions. */
export const REGION_SELECT_OPTIONS = [
  { value: '', label: 'All regions' },
  ...NAMIBIA_REGIONS,
];

/** Check if a string is a valid region code (case-insensitive; accepts "ǁKaras" for Karas). */
export function isValidRegion(value: string | null | undefined): value is NamibiaRegionCode {
  if (value == null || value === '') return false;
  const normalized = value.trim();
  if (normalized === 'ǁKaras' || normalized === 'ǁkaras') return true;
  return NAMIBIA_REGION_CODES.some((r) => r.toLowerCase() === normalized.toLowerCase());
}

/** Normalize region for DB/API (e.g. "Karas" or "khomas" -> "Khomas"; "ǁKaras" -> "Karas"). */
export function normalizeRegion(value: string | null | undefined): NamibiaRegionCode | null {
  if (value == null || value === '') return null;
  const v = value.trim();
  if (v === 'ǁKaras' || v === 'ǁkaras') return 'Karas';
  const found = NAMIBIA_REGION_CODES.find((r) => r.toLowerCase() === v.toLowerCase());
  return found ?? null;
}
