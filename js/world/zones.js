// Zone definitions: floor tiles, props, portals, NPCs, and interaction nodes.
// The world is an upgradeable office suite, apartment, and an empty courtroom.
// Office portals lead to the partners' offices and conference room.
//
// Tile chars: 'w' wood  'r' rug  'x' void (never walkable)

import { hasUpgrade } from '../state.js';

const inRect = (x, y, x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

export const ZONES = {
  // ------------------------------------------------------------------ OFFICE
  office: {
    id: 'office',
    name: 'Hardsell & Firestone — Main Office',
    w: 14, h: 12,
    walls: 'wood',
    spawn: { x: 6, y: 10 },
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
      { type: 'bookshelf', x: 10, y: 1, full: () => hasUpgrade('subscription'),
        interact: { label: 'Ethics Treatises — Rule Library', action: 'rules' } },
      { type: 'clientchair', x: 5, y: 4 },
      { type: 'cabinet', x: 12, y: 3,
        interact: { label: 'Office Upgrades Catalog', action: 'shop_office' } },
      { type: 'filingstation', x: 11, y: 6,
        interact: { label: 'Filing Cabinet — Review Documents', action: 'doc_review' } },
      { type: 'sofa', x: 1, y: 6, visible: () => hasUpgrade('seating') },
      { type: 'paralegaldesk', x: 1, y: 8 },
      { type: 'paralegaldesk', x: 9, y: 8, visible: () => hasUpgrade('paralegal') },
      { type: 'plant', x: 1, y: 4 },
    ],
    portals: [
      { x: 13, y: 2, label: 'Jim Hardsell’s Corner Office', to: 'corner_office' },
      { x: 13, y: 5, label: 'Linda Firestone’s Office', to: 'linda_office' },
      { x: 13, y: 9, label: 'Conference Room', to: 'conference_room' },
      { x: 6, y: 11, label: 'Leave the Office', travel: true },
    ],
    npcs: [
      { id: 'secretary', name: 'Liz Loza, Secretary', x: 2, y: 7,
        look: { suit: '#6e2436', gender: 'female', skin: 2, hair: 1, hairStyle: 3, eye: 2 },
        icon: 'dot', talk: 'secretary' },
      { id: 'paralegal', name: 'Riley Readsalot, Paralegal', x: 10, y: 7,
        look: { suit: '#3f5d4b', gender: 'nonbinary', skin: 2, hair: 4, hairStyle: 2, eye: 2 },
        icon: 'dot', talk: 'paralegal',
        visible: () => hasUpgrade('paralegal') },
    ],
  },

  // ---------------------------------------------------------- CORNER OFFICE
  corner_office: {
    id: 'corner_office',
    name: 'Jim Hardsell’s Corner Office',
    w: 10, h: 8,
    walls: 'navy',
    spawn: { x: 5, y: 6 },
    tile(x, y) {
      if (inRect(x, y, 3, 3, 6, 5)) return 'r';
      return 'w';
    },
    props: [
      { type: 'wallwindow', x: 1, y: 0 },
      { type: 'wallwindow', x: 3, y: 0 },
      { type: 'wallwindow', x: 5, y: 0 },
      { type: 'wallwindow', x: 7, y: 0 },
      { type: 'executivedesk', x: 3, y: 3, nameplate: true },
      { type: 'clientchair', x: 3, y: 5 },
      { type: 'clientchair', x: 6, y: 5 },
      { type: 'plant', x: 8, y: 5 },
    ],
    portals: [
      { x: 5, y: 7, label: 'Return to the Main Office', to: 'office', dest: { x: 12, y: 2 } },
    ],
    npcs: [
      { id: 'jim', name: 'Jim Hardsell, Managing Partner', x: 4, y: 2,
        look: { suit: '#2b2b33', gender: 'male', skin: 4, hair: 3, hairStyle: 0, eye: 0 },
        icon: 'dot', talk: 'jim' },
    ],
  },

  // ----------------------------------------------------------- LINDA OFFICE
  linda_office: {
    id: 'linda_office',
    name: 'Linda Firestone’s Office',
    w: 9, h: 8,
    walls: 'burgundy',
    spawn: { x: 4, y: 6 },
    tile(x, y) {
      if (inRect(x, y, 2, 3, 6, 5)) return 'r';
      return 'w';
    },
    props: [
      { type: 'wallwindow', x: 1, y: 0 },
      { type: 'wallwindow', x: 3, y: 0 },
      { type: 'wallwindow', x: 5, y: 0 },
      { type: 'executivedesk', x: 3, y: 3, nameplate: true },
      { type: 'bookshelf', x: 6, y: 4, full: true },
      { type: 'plant', x: 1, y: 5 },
    ],
    portals: [
      { x: 4, y: 7, label: 'Return to the Main Office', to: 'office', dest: { x: 12, y: 5 } },
    ],
    npcs: [
      { id: 'linda', name: 'Linda Firestone, Partner', x: 4, y: 2,
        look: { suit: '#6e2436', gender: 'female', skin: 1, hair: 0, hairStyle: 1, eye: 1 },
        icon: 'dot', talk: 'linda' },
    ],
  },

  // --------------------------------------------------------- CONFERENCE ROOM
  conference_room: {
    id: 'conference_room',
    name: 'Conference Room',
    w: 11, h: 9,
    walls: 'green',
    spawn: { x: 5, y: 7 },
    tile(x, y) {
      if (inRect(x, y, 3, 3, 7, 6)) return 'r';
      return 'w';
    },
    props: [
      { type: 'tv', x: 4, y: 1 },
      { type: 'conftable', x: 4, y: 4 },
      { type: 'clientchair', x: 3, y: 4 },
      { type: 'clientchair', x: 7, y: 4 },
      { type: 'clientchair', x: 4, y: 6 },
      { type: 'clientchair', x: 6, y: 6 },
      { type: 'plant', x: 1, y: 6 },
      { type: 'plant', x: 9, y: 6 },
    ],
    portals: [
      { x: 5, y: 8, label: 'Return to the Main Office', to: 'office', dest: { x: 12, y: 9 } },
    ],
    npcs: [],
  },

  // --------------------------------------------------------------- COURTROOM
  courtroom: {
    id: 'courtroom',
    name: 'Courtroom — No Matters on Calendar',
    w: 13, h: 11,
    walls: 'marble',
    spawn: { x: 6, y: 9 },
    tile(x, y) {
      if (inRect(x, y, 1, 1, 11, 9)) return 'm';
      return 'M';
    },
    props: [
      { type: 'judgebench', x: 5, y: 1 },
      { type: 'witnessstand', x: 2, y: 3 },
      { type: 'clerkcounter', x: 9, y: 3 },
      { type: 'counseltable', x: 3, y: 6 },
      { type: 'counseltable', x: 8, y: 6 },
      { type: 'bench', x: 2, y: 8 },
      { type: 'bench', x: 5, y: 8 },
      { type: 'bench', x: 8, y: 8 },
    ],
    portals: [
      { x: 6, y: 10, label: 'Leave the Empty Courtroom', travel: true },
    ],
    npcs: [],
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
      { type: 'wallwindow', x: 3, y: 0, visible: () => hasUpgrade('cityview') },
      { type: 'tv', x: 5, y: 3, visible: () => hasUpgrade('cityview') },
      { type: 'sofa', x: 3, y: 5, visible: () => hasUpgrade('cityview') },
      { type: 'plant', x: 1, y: 6 },
    ],
    portals: [
      { x: 4, y: 8, label: 'Leave the Apartment', travel: true },
    ],
    npcs: [],
  },
};
