// Apartment pets: a one-time adoption that adds a wandering companion to the
// player's apartment. Purely cosmetic; no grading or economy effect after the fee.

export const PET_COST = 2000;
export const DEFAULT_PET_NAME = 'Counsel';
export const PET_KINDS = [
  { id: 'cat', label: 'Cat', note: 'Sleeps on the treatises. Judges silently.' },
  { id: 'dog', label: 'Dog', note: 'Greets every visitor as opposing counsel, then as a friend.' },
];

export function petKind(id) { return PET_KINDS.find((kind) => kind.id === id) || null; }

// Names are trimmed, collapsed to single spaces and capped at 24 characters,
// matching the creator's name field; blank names fall back to the default.
export function sanitizePetName(value) {
  const clean = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ').slice(0, 24);
  return clean || DEFAULT_PET_NAME;
}
