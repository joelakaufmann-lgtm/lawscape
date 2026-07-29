// Zone definitions: floor tiles, props, portals, NPCs, and interaction nodes.
// The world is your upgradeable Law Office and Apartment; leaving either one
// opens the travel menu (the courthouse shows up there, permanently closed —
// see ROADMAP.md, Court Simulation).
//
// Tile chars: 'w' wood  'r' rug  'x' void (never walkable)

import { hasUpgrade } from '../state.js';

const inRect = (x, y, x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

export const ZONES = {
  // ------------------------------------------------------------------ OFFICE
  office: {
    id: 'office',
    name: 'Your Law Office',
    w: 13, h: 11,
    walls: 'wood',
    spawn: { x: 6, y: 9 },
    tile(x, y) {
      if (inRect(x, y, 4, 3, 8, 6)) return 'r';
      return 'w';
    },
    props: [
      { type: 'desk', x: 6, y: 1,
        tier: () => (hasUpgrade('conference') ? 2 : hasUpgrade('subscription') ? 1 : 0),
        monitors: () => (hasUpgrade('monitor') ? 2 : 1),
        interact: { label: 'Your Computer — BarMail', action: 'email' } },
      { type: 'caseboard', x: 2, y: 1,
        interact: { label: 'Case Board — Your Record', action: 'record' } },
      { type: 'bookshelf', x: 9, y: 1, full: () => hasUpgrade('subscription'),
        interact: { label: 'Ethics Treatises', action: 'flavor_books' } },
      { type: 'clientchair', x: 5, y: 4 },
      { type: 'cabinet', x: 11, y: 3,
        interact: { label: 'Office Upgrades Catalog', action: 'shop_office' } },
      { type: 'sofa', x: 1, y: 6, visible: () => hasUpgrade('seating') },
      { type: 'paralegaldesk', x: 9, y: 7, visible: () => hasUpgrade('paralegal') },
      { type: 'conftable', x: 4, y: 7, visible: () => hasUpgrade('conference') },
      { type: 'plant', x: 1, y: 4 },
    ],
    portals: [
      { x: 6, y: 10, label: 'Leave the Office', travel: true },
    ],
    npcs: [
      { id: 'partner', name: 'Marcus Hargrove, Senior Partner', x: 4, y: 2,
        look: { suit: '#3a3a42', gender: 'male', skin: 4, hair: 3, hairStyle: 0, eye: 0 },
        icon: 'dot', talk: 'partner' },
      { id: 'paralegal', name: 'Riley (Paralegal)', x: 10, y: 8,
        look: { suit: '#3f5d4b', gender: 'nonbinary', skin: 2, hair: 4, hairStyle: 2, eye: 2 },
        icon: 'dot', talk: 'paralegal',
        visible: () => hasUpgrade('paralegal') },
    ],
  },

  // ---------------------------------------------------------------- APARTMENT
  apartment: {
    id: 'apartment',
    name: 'Your Apartment',
    w: 10, h: 9,
    walls: 'burgundy',
    spawn: { x: 4, y: 7 },
    tile(x, y) {
      if (inRect(x, y, 3, 3, 6, 5)) return 'r';
      return 'w';
    },
    props: [
      { type: 'bed', x: 1, y: 1, tier: () => (hasUpgrade('mattress') ? 1 : 0),
        interact: { label: 'Bed — Rest (restore Ethics)', action: 'rest' } },
      { type: 'kitchenette', x: 5, y: 1, nice: () => hasUpgrade('kitchen') },
      { type: 'coffeemachine', x: 8, y: 2, owned: () => hasUpgrade('coffee'),
        interact: { label: 'Coffee Machine', action: 'flavor_coffee' } },
      { type: 'wardrobe', x: 8, y: 4, interact: { label: 'Wardrobe', action: 'wardrobe' } },
      { type: 'cabinet', x: 1, y: 4,
        interact: { label: 'Furniture Catalog', action: 'shop_apartment' } },
      { type: 'homedesk', x: 8, y: 6, visible: () => hasUpgrade('homedesk') },
      { type: 'plant', x: 1, y: 6 },
    ],
    portals: [
      { x: 4, y: 8, label: 'Leave the Apartment', travel: true },
    ],
    npcs: [],
  },
};
