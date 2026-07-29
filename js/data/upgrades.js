// Upgrade catalogs, priced in gold earned from BarMail ethics scenarios.
// Effects are applied in main.js (gold/damage math) and js/world/zones.js
// (visual prop changes).

export const OFFICE_UPGRADES = [
  { id: 'monitor', name: 'Second Monitor', cost: 60,
    desc: '+15% gold from correct answers. A second screen appears on your desk.' },
  { id: 'subscription', name: 'Ethics Treatise Shelf', cost: 140,
    desc: 'Unlocks the searchable Nevada, Arizona, and California reference library. Required for Riley’s paid ethics hints.' },
  { id: 'seating', name: 'Client Seating Area', cost: 220,
    desc: 'Grateful clients tip: +10 gold flat on every correct answer. A respectable sofa appears.' },
  { id: 'paralegal', name: 'Paralegal Upgrade — Riley Readsalot', cost: 450,
    desc: 'Very wrong answers deal 15 damage instead of 25. With the treatise shelf, Riley can research a relevant-rule hint for 100 gold.' },
  { id: 'conference', name: 'Conference Room AV Upgrade', cost: 900,
    desc: '+25% gold from correct answers and upgraded case-presentation equipment.' },
];

export const APARTMENT_UPGRADES = [
  { id: 'mattress', name: 'Better Mattress', cost: 80,
    desc: '+20 max Ethics. A principled attorney is a well-rested attorney.' },
  { id: 'coffee', name: 'Coffee Machine', cost: 120,
    desc: 'Drink a cup to restore 2 Ethics. Clarity in a cup.' },
  { id: 'wardrobe_rack', name: 'Wardrobe Rack', cost: 160,
    desc: 'Unlocks suit color changes at the wardrobe.' },
  { id: 'homedesk', name: 'Home CLE Desk', cost: 260,
    desc: 'Evening ethics study: resting in bed restores +10 more Ethics.' },
  { id: 'kitchen', name: 'Kitchen Upgrade', cost: 400,
    desc: 'Home cooking: bed rest available every 2 minutes instead of 4.' },
  { id: 'cityview', name: 'City View Apartment', cost: 1200,
    desc: '+25% gold from correct answers. Adds a skyline window, couch, and television to the apartment.' },
];

export function findUpgrade(id) {
  return OFFICE_UPGRADES.find((u) => u.id === id) || APARTMENT_UPGRADES.find((u) => u.id === id);
}

// Aggregate bonuses from owned upgrades.
export function bonuses(upgrades) {
  const has = (id) => upgrades.includes(id);
  return {
    goldMult: 1 + (has('monitor') ? 0.15 : 0) + (has('conference') ? 0.25 : 0)
                + (has('cityview') ? 0.25 : 0),
    goldFlat: has('seating') ? 10 : 0,
    veryWrongDmg: has('paralegal') ? 15 : 25,
    streakHealBonus: 0,
    restHeal: 15 + (has('homedesk') ? 10 : 0),
    restCooldownMs: has('kitchen') ? 120_000 : 240_000,
  };
}
