// Upgrade catalogs, priced in gold earned from BarMail ethics scenarios.
// Effects are applied in main.js (gold/damage math) and js/world/zones.js
// (visual prop changes).

export const OFFICE_UPGRADES = [
  { id: 'monitor', name: 'Second Monitor', cost: 60,
    desc: '+15% gold from correct answers. A second screen appears on your desk.' },
  { id: 'subscription', name: 'Ethics Treatise Shelf', cost: 250,
    desc: 'Unlocks the searchable reference library: Nevada, Arizona, California, New York, the FLSC Model Code (Canada) and the SRA Standards (England & Wales). Required for Riley’s paid ethics hints.' },
  { id: 'liz_chair', name: 'New Chair for Liz Loza', cost: 250,
    desc: '+10 max Ethics. Replaces the broken chair Liz has been balancing on since 1987.' },
  { id: 'houseplants', name: 'Houseplants', cost: 500,
    desc: 'Maybe this will cheer Liz up. Adds greenery and slightly improves her mood.' },
  { id: 'espresso', name: 'Espresso Machine', cost: 1000,
    desc: 'Pull a shot in the main office to restore 5 Ethics (90-second cooldown) and sober up instantly.' },
  { id: 'paralegal', name: 'Paralegal Upgrade — Riley Readsalot', cost: 2000,
    desc: 'Riley halves Ethics damage from wrong answers. With the treatise shelf, Riley can research a relevant-rule hint for 100 gold.' },
  { id: 'work_phone', name: 'Work Phone', cost: 2000,
    desc: 'Open the full BarMail inbox anywhere: ethics practice, writing assignments, and partner replies. Jim can now find you at the bar.' },
  { id: 'snack_fridge', name: 'Office Snack Fridge', cost: 2000,
    desc: 'A stocked fridge in the main office. Grab a snack to restore 8 Ethics (two-minute cooldown). Liz will have opinions about the yoghurt.' },
];

export const APARTMENT_UPGRADES = [
  { id: 'mattress', name: 'Better Mattress', cost: 80,
    desc: '+20 max Ethics and a proper queen bed with a real headboard. A principled attorney is a well-rested attorney.' },
  { id: 'coffee', name: 'Coffee Machine', cost: 500,
    desc: 'Drink a cup to restore 2 Ethics. Clarity in a cup.' },
  { id: 'wardrobe_rack', name: 'Wardrobe Rack', cost: 160,
    desc: 'Adds a brass rail with displayed suits to your apartment wardrobe and unlocks formal wear (tuxedo, evening gown) for purchase. All appearance colors are available without this upgrade.' },
  { id: 'homedesk', name: 'Clock', cost: 260,
    desc: 'Adds a wall clock. Keeping a healthy sleep schedule makes bed rest restore +10 more Ethics.' },
  { id: 'kitchen', name: 'Kitchen Upgrade', cost: 400,
    desc: '+10 max Ethics and faster rest. Cook a meal for 5 gold to restore 30 Ethics.' },
  { id: 'cityview', name: 'City View Apartment', cost: 1200,
    desc: '+25% gold from correct answers. Adds a skyline window and a couch where you can sit and enjoy the view.' },
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
