// Upgrade catalogs, priced in gold earned from BarMail ethics scenarios.
// Effects are applied in main.js (gold/damage math) and js/world/zones.js
// (visual prop changes).

export const OFFICE_UPGRADES = [
  { id: 'monitor', name: 'Second Monitor', cost: 60,
    desc: '+15% gold from correct answers. A second screen appears on your desk.' },
  { id: 'subscription', name: 'Ethics Treatise Shelf', cost: 250,
    desc: 'Unlocks the searchable Nevada, Arizona, and California reference library. Required for Riley’s paid ethics hints.' },
  { id: 'liz_chair', name: 'Chair for Liz Loza', cost: 250,
    desc: '+10 max Ethics. At last, Liz has somewhere to sit.' },
  { id: 'houseplants', name: 'Houseplants', cost: 500,
    desc: 'Maybe this will cheer Liz up. Adds greenery and slightly improves her mood.' },
  { id: 'paralegal', name: 'Paralegal Upgrade — Riley Readsalot', cost: 2000,
    desc: 'Riley halves Ethics damage from wrong answers. With the treatise shelf, Riley can research a relevant-rule hint for 100 gold.' },
  { id: 'office_window', name: 'Office Upgrade', cost: 2000,
    desc: 'You convince the partners to give you a window. It is a tiny porthole, but it is yours.' },
  { id: 'artwork', name: 'Artwork', cost: 2000,
    desc: 'A single black dot on a white canvas adds unmistakable warmth to the office.' },
];

export const APARTMENT_UPGRADES = [
  { id: 'mattress', name: 'Better Mattress', cost: 80,
    desc: '+20 max Ethics. A principled attorney is a well-rested attorney.' },
  { id: 'coffee', name: 'Coffee Machine', cost: 500,
    desc: 'Drink a cup to restore 2 Ethics. Clarity in a cup.' },
  { id: 'wardrobe_rack', name: 'Wardrobe Rack', cost: 160,
    desc: 'Unlocks suit color changes at the wardrobe.' },
  { id: 'homedesk', name: 'Clock', cost: 260,
    desc: 'Adds a wall clock. Keeping a healthy sleep schedule makes bed rest restore +10 more Ethics.' },
  { id: 'kitchen', name: 'Kitchen Upgrade', cost: 400,
    desc: '+10 max Ethics and faster rest. Cooking food in your kitchen fuels ethical decision-making ability.' },
  { id: 'cityview', name: 'City View Apartment', cost: 1200,
    desc: '+25% gold from correct answers. Adds a skyline window, television, and a couch where you can sit and watch.' },
];

export function findUpgrade(id) {
  return OFFICE_UPGRADES.find((u) => u.id === id) || APARTMENT_UPGRADES.find((u) => u.id === id);
}

// Aggregate bonuses from owned upgrades.
export function bonuses(upgrades) {
  const has = (id) => upgrades.includes(id);
  return {
    goldMult: 1 + (has('monitor') ? 0.15 : 0) + (has('cityview') ? 0.25 : 0),
    goldFlat: 0,
    streakHealBonus: 0,
    restHeal: 15 + (has('homedesk') ? 10 : 0),
    restCooldownMs: has('kitchen') ? 120_000 : 240_000,
  };
}
