// Zone definitions: floor tiles, props, portals, NPCs, and interaction nodes.
// The world is an office suite, apartment, courtroom, The Sidebar lounge and
// the street that joins the buildings. Office portals lead to the partners'
// offices and conference room; every building door opens onto the street.
//
// Tile chars: 'w' wood  'r' rug  'm'/'M' marble  'p' pavement  'a' asphalt
//             'x' void (never walkable)
// Prop extras: `facing:'n'` (chairs/benches open toward the back wall),
// `screen:'n'` (desk monitors face the person seated north of the desk),
// `broken:()=>bool` (Liz's chair), `label` (bookshelf plaque).
// NPC extras: `seated:true`, `wander:true`, `look` may be a function.

import { hasUpgrade, state } from '../state.js';

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
        tier: () => (hasUpgrade('subscription') ? 1 : 0),
        monitors: () => (hasUpgrade('monitor') ? 2 : 1),
        phone: () => hasUpgrade('work_phone'),
        interact: { label: 'Your Computer — BarMail', action: 'email' } },
      { type: 'caseboard', x: 2, y: 1,
        interact: { label: 'Case Board — Your Record', action: 'record' } },
      { type: 'bookshelf', x: 10, y: 1, full: () => hasUpgrade('subscription'),
        interact: { label: 'Ethics Treatises — Rule Library', action: 'rules' } },
      { type: 'cabinet', x: 3, y: 3,
        interact: { label: 'Office Upgrades Catalog', action: 'shop_office' } },
      { type: 'filingstation', x: 1, y: 3,
        interact: { label: 'Filing Cabinet — Review Documents', action: 'doc_review' } },
      { type: 'paralegaldesk', x: 1, y: 8 },
      { type: 'paralegaldesk', x: 9, y: 8, visible: () => hasUpgrade('paralegal') },
      { type: 'officechair', x: 9, y: 9, visible: () => hasUpgrade('paralegal') },
      // Liz sits at the screen side of her desk. The chair is broken until the
      // "Chair for Liz Loza" upgrade replaces it.
      { type: 'officechair', x: 1, y: 9, broken: () => !hasUpgrade('liz_chair') },
      { type: 'coffeemachine', x: 12, y: 1, owned: () => true, visible: () => hasUpgrade('espresso'),
        interact: { label: 'Espresso Machine — +5 Ethics, sobers you up', action: 'espresso' } },
      { type: 'plant', x: 1, y: 6, visible: () => hasUpgrade('houseplants') },
      { type: 'plant', x: 4, y: 1, visible: () => hasUpgrade('houseplants') },
      { type: 'fridge', x: 12, y: 3, stocked: () => true, visible: () => hasUpgrade('snack_fridge'),
        interact: { label: 'Snack Fridge — grab a snack (+8 Ethics)', action: 'snack' } },
    ],
    portals: [
      { x: 13, y: 2, label: 'Jim Hardsell’s Corner Office', to: 'corner_office' },
      { x: 13, y: 5, label: 'Linda Firestone’s Office', to: 'linda_office' },
      { x: 13, y: 7, label: 'Associates’ Floor', to: 'associates', dest: { x: 16, y: 6 } },
      { x: 13, y: 9, label: 'Conference Room', to: 'conference_room' },
      { x: 6, y: 11, label: 'Leave the Office — to the street', to: 'street', dest: { x: 4, y: 2 } },
    ],
    npcs: [
      { id: 'secretary', name: 'Liz Loza, Secretary', x: 1, y: 9, seated: true,
        look: { suit: '#6e2436', gender: 'female', skin: 2, hair: 1, hairStyle: 3, eye: 2 },
        icon: 'dot', talk: 'secretary' },
      { id: 'paralegal', name: 'Riley Readsalot, Paralegal', x: 9, y: 9, seated: true,
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
      { type: 'executivedesk', x: 3, y: 3, nameplate: true, screen: 'n' },
      { type: 'officechair', x: 4, y: 2 },
      { type: 'clientchair', x: 3, y: 5, facing: 'n' },
      { type: 'clientchair', x: 6, y: 5, facing: 'n' },
      { type: 'safe', x: 1, y: 5, empty: () => state.moneybagsStolen,
        interact: { label: 'Mr. Hardsell’s Safe — Client Gold', action: 'moneybags_safe' } },
      { type: 'barcart', x: 8, y: 1,
        interact: { label: 'Bar Cart — Decanter and Glass', action: 'whiskey' } },
    ],
    portals: [
      { x: 5, y: 7, label: 'Return to the Main Office', to: 'office', dest: { x: 12, y: 2 } },
    ],
    npcs: [
      { id: 'jim', name: 'Jim Hardsell, Managing Partner', x: 4, y: 2, seated: true,
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
      { type: 'executivedesk', x: 3, y: 3, nameplate: true, screen: 'n' },
      { type: 'officechair', x: 4, y: 2 },
      { type: 'bookshelf', x: 7, y: 1, full: true, label: 'CASE REPORTS' },
      { type: 'plant', x: 1, y: 5 },
    ],
    portals: [
      { x: 4, y: 7, label: 'Return to the Main Office', to: 'office', dest: { x: 12, y: 5 } },
    ],
    npcs: [
      { id: 'linda', name: 'Linda Firestone, Partner', x: 4, y: 2, seated: true,
        look: { suit: '#6e2436', gender: 'female', skin: 1, hair: 2, hairStyle: 1, eye: 1 },
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
      { type: 'clientchair', x: 4, y: 6, facing: 'n' },
      { type: 'clientchair', x: 6, y: 6, facing: 'n' },
      { type: 'plant', x: 1, y: 2 },
      { type: 'plant', x: 1, y: 7 },
      { type: 'plant', x: 10, y: 2 },
      { type: 'plant', x: 10, y: 7 },
    ],
    portals: [
      { x: 5, y: 8, label: 'Return to the Main Office', to: 'office', dest: { x: 12, y: 9 } },
    ],
    npcs: [],
  },

  // --------------------------------------------------------------- COURTROOM
  courtroom: {
    id: 'courtroom',
    name: 'Courtroom — Derek Balam on Duty',
    w: 13, h: 11,
    walls: 'marble',
    spawn: { x: 6, y: 9 },
    tile(x, y) {
      if (inRect(x, y, 1, 1, 11, 9)) return 'm';
      return 'M';
    },
    props: [
      { type: 'judgebench', x: 5, y: 1, interact: { label: 'Sleeping AI Judge — Court Not in Session', action: 'judge' } },
      { type: 'witnessstand', x: 2, y: 3 },
      { type: 'clerkcounter', x: 9, y: 3 },
      { type: 'counseltable', x: 3, y: 6 },
      { type: 'counseltable', x: 8, y: 6 },
      { type: 'bench', x: 2, y: 8, facing: 'n' },
      { type: 'bench', x: 5, y: 8, facing: 'n' },
      { type: 'bench', x: 8, y: 8, facing: 'n' },
    ],
    portals: [
      { x: 6, y: 10, label: 'Leave the Courtroom — to the street', to: 'street', dest: { x: 20, y: 2 } },
    ],
    npcs: [
      { id: 'derek_balam', name: 'Derek Balam, Bailiff', x: 10, y: 5,
        look: { suit: '#1f3a5f', shirt: '#c8d8e6', tie: '#34363c', skin: 3, hair: 6, hairStyle: 6, eye: 0, facialHair: 2, faceShape: 1, silhouette: 'relaxed', outfit: 'trousers', badge: true },
        icon: 'dot', talk: 'bailiff' },
    ],
  },

  // --------------------------------------------------------------- THE SIDEBAR
  sidebar: {
    id: 'sidebar', name: 'The Sidebar — Local Lounge',
    w: 14, h: 12, walls: 'green', spawn: { x: 7, y: 10 },
    tile(x, y) {
      if (inRect(x, y, 8, 4, 12, 10) || inRect(x, y, 1, 7, 5, 10)) return 'r';
      return 'w';
    },
    props: [
      { type: 'sidebarback', x: 2, y: 1 },
      { type: 'sidebarcounter', x: 2, y: 3,
        interact: { label: 'B.A.R.T. — Order a Drink', action: 'bartender' } },
      { type: 'barstool', x: 2, y: 5, interact: { label: 'Bar Stool — Take a Seat', action: 'sidebar_sit' } },
      { type: 'barstool', x: 4, y: 5, interact: { label: 'Bar Stool — Take a Seat', action: 'sidebar_sit' } },
      { type: 'barstool', x: 6, y: 5, interact: { label: 'Bar Stool — Take a Seat', action: 'sidebar_sit' } },
      { type: 'topictable', x: 9, y: 4, label: 'EVIDENCE', topic: 'evidence',
        interact: { label: 'Evidence Table', action: 'sidebar_chat' } },
      { type: 'clientchair', x: 12, y: 4 },
      { type: 'topictable', x: 9, y: 8, label: 'AI & AGENTS', topic: 'agents',
        interact: { label: 'AI & Agents Table', action: 'sidebar_chat' } },
      { type: 'clientchair', x: 12, y: 8 },
      { type: 'topictable', x: 2, y: 8, label: 'WRITING', topic: 'writing',
        interact: { label: 'Writing Table', action: 'sidebar_chat' } },
      { type: 'clientchair', x: 5, y: 8 },
      { type: 'scoreboard', x: 10, y: 1,
        interact: { label: 'Billable Hours — High Score Board', action: 'high_scores' } },
      { type: 'plant', x: 1, y: 6 },
      { type: 'plant', x: 12, y: 2 },
      { type: 'floorlamp', x: 1, y: 10 },
      { type: 'arcade', x: 8, y: 1,
        interact: { label: 'Briefcase Dash — Arcade Cabinet', action: 'arcade' } },
    ],
    portals: [{ x: 7, y: 11, label: 'Leave The Sidebar — to the street', to: 'street', dest: { x: 28, y: 2 } }],
    npcs: [
      { id: 'sidebar_host', name: 'B.A.R.T., Robotic Butler & Bartender', x: 5, y: 2,
        look: { robotButler: true },
        icon: 'dot', talk: 'sidebar_host' },
    ],
  },

  // ------------------------------------------------------- ASSOCIATES' FLOOR
  // Open-plan associate area shared by every attorney at the firm. Desks are
  // claimed one at a time; the occupant's name appears on the brass plate.
  associates: {
    id: 'associates', name: 'Hardsell & Firestone — Associates’ Floor',
    w: 18, h: 13, walls: 'wood', spawn: { x: 9, y: 11 },
    tile(x, y) {
      if (inRect(x, y, 2, 5, 15, 6)) return 'r';
      return 'w';
    },
    props: [
      ...[['A1', 2, 3], ['A2', 6, 3], ['A3', 10, 3], ['A4', 14, 3], ['B1', 2, 8], ['B2', 6, 8], ['B3', 10, 8], ['B4', 14, 8]]
        .map(([deskId, x, y]) => ({
          type: 'opendesk', x, y, deskId, seat: { x, y: y + 1 }, occupant: null, monitors: () => 1,
          interact: { label: (prop) => prop.occupant ? `Open desk ${deskId} — ${prop.occupant}` : `Open desk ${deskId} — Sit down`, action: 'desk_sit' },
        })),
      { type: 'bookshelf', x: 16, y: 1, full: () => true, label: 'FIRM LIBRARY',
        interact: { label: 'Firm Library — Rule Library', action: 'rules' } },
      { type: 'noticeboard', x: 4, y: 0 },
      { type: 'wallclock', x: 9, y: 0 },
      { type: 'coffeemachine', x: 1, y: 11 },
      { type: 'readingtable', x: 12, y: 11 },
      { type: 'plant', x: 1, y: 1 },
      { type: 'plant', x: 16, y: 11 },
    ],
    portals: [
      { x: 17, y: 6, label: 'Main Office', to: 'office', dest: { x: 12, y: 7 } },
      { x: 9, y: 12, label: 'Leave the Associates’ Floor — to the street', to: 'street', dest: { x: 4, y: 2 } },
    ],
    npcs: [],
  },

  // ------------------------------------------------------------------ STREET
  // A long, shallow sidewalk that reads side-on: facades along the top row,
  // the road below. Every building door is a portal in front of its doorway.
  street: {
    id: 'street',
    name: 'Juris Avenue',
    w: 32, h: 6,
    outdoor: true,
    spawn: { x: 4, y: 2 },
    tile(x, y) {
      return y <= 3 ? 'p' : 'a';
    },
    props: [
      { type: 'facade', x: 2, y: 0, style: 'office' },
      { type: 'facade', x: 10, y: 0, style: 'apartment' },
      { type: 'facade', x: 18, y: 0, style: 'court' },
      { type: 'facade', x: 26, y: 0, style: 'sidebar' },
      { type: 'lamppost', x: 8, y: 2 },
      { type: 'lamppost', x: 16, y: 2 },
      { type: 'lamppost', x: 24, y: 2 },
      { type: 'tree', x: 0, y: 2 },
      { type: 'tree', x: 31, y: 2 },
      { type: 'planter', x: 7, y: 1 },
      { type: 'planter', x: 15, y: 1 },
      { type: 'planter', x: 23, y: 1 },
    ],
    portals: [
      { x: 4, y: 1, label: 'Hardsell & Firestone — Law Office', to: 'office', dest: { x: 6, y: 11 } },
      { x: 12, y: 1, label: 'Apartments — Your Apartment', to: 'apartment', dest: { x: 4, y: 8 } },
      { x: 20, y: 1, label: 'Courthouse', to: 'courtroom', dest: { x: 6, y: 10 } },
      { x: 28, y: 1, label: 'The Sidebar — Local Lounge', to: 'sidebar', dest: { x: 7, y: 11 } },
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
      // The Better Mattress swaps the single bed for a 2×2 queen (kitchenette/stove pattern).
      { type: 'bed', x: 1, y: 1, visible: () => !hasUpgrade('mattress'),
        interact: { label: 'Bed — Rest (restore Ethics)', action: 'rest' } },
      { type: 'bigbed', x: 1, y: 1, visible: () => hasUpgrade('mattress'),
        interact: { label: 'Queen Bed — Rest (restore Ethics)', action: 'rest' } },
      { type: 'kitchenette', x: 5, y: 1, visible: () => !hasUpgrade('kitchen'),
        interact: { label: 'Ramen Noodles — 5 gold / +5 Ethics', action: 'eat_ramen' } },
      { type: 'stove', x: 5, y: 1, visible: () => hasUpgrade('kitchen'),
        interact: { label: 'Kitchen — Cook Meal (5 gold / +30 Ethics)', action: 'cook_meal' } },
      { type: 'fridge', x: 7, y: 1, visible: () => hasUpgrade('kitchen') },
      { type: 'coffeemachine', x: 8, y: 1, owned: () => hasUpgrade('coffee'),
        interact: { label: 'Coffee Machine', action: 'flavor_coffee' } },
      { type: 'wardrobe', x: 1, y: 5, expanded: () => hasUpgrade('wardrobe_rack'), interact: { label: 'Wardrobe', action: 'wardrobe' } },
      { type: 'cabinet', x: 1, y: 4,
        interact: { label: 'Furniture Catalog', action: 'shop_apartment' } },
      { type: 'wallclock', x: 6, y: 0, visible: () => hasUpgrade('homedesk') },
      { type: 'wallwindow', x: 3, y: 0, visible: () => hasUpgrade('cityview') },
      { type: 'sofa', x: 4, y: 5, visible: () => hasUpgrade('cityview'),
        interact: { label: 'Couch — Sit and Enjoy the City View', action: 'watch_tv' } },
      { type: 'plant', x: 1, y: 7 },
    ],
    portals: [
      { x: 4, y: 8, label: 'Leave the Apartment — to the street', to: 'street', dest: { x: 12, y: 2 } },
    ],
    npcs: [
      // The adopted pet wanders the apartment once `adopt_pet` has run.
      { id: 'pet', get name() { return state.pet?.name || 'Pet'; }, x: 6, y: 6,
        look: () => ({ pet: state.pet }), talk: 'pet', wander: true, speed: 2,
        visible: () => !!state.pet },
    ],
  },
};
