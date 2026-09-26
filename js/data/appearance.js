import { PAL } from '../engine/palette.js';

// The first six hair IDs and the first six color indices match legacy saves.
export const HAIR_STYLES = ['Side part', 'Long waves', 'Low ponytail', 'Neat bun', 'Natural curls', 'Bald',
  'Close crop', 'Swept back', 'Chin-length bob', 'High ponytail', 'Braids', 'Locs', 'Tapered curls', 'Side-swept fringe', 'Textured crop', 'Half-up waves'];
export const HAIR_COLORS = ['Soft black', 'Walnut brown', 'Golden blond', 'Silver', 'Auburn', 'Platinum',
  'Espresso', 'Chestnut', 'Honey blond', 'Copper', 'Strawberry blond', 'Salt and pepper',
  'Charcoal', 'Blue black', 'Burgundy', 'Midnight blue', 'Plum', 'Dusty rose'];
export const FACIAL_HAIR = ['Clean shaven', 'Stubble', 'Moustache', 'Goatee', 'Short beard', 'Full beard', 'Moustache & goatee'];
export const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber'];
export const SKIN_COLORS = ['Porcelain', 'Light warm', 'Golden', 'Medium warm', 'Deep golden', 'Rich brown', 'Deep brown'];
export const TIE_COLORS = ['Burgundy', 'Navy', 'Forest', 'Ochre', 'Plum', 'Teal', 'Rose', 'Charcoal', 'Steel', 'Ivory', 'Rust', 'Slate blue'];
export const SUIT_COLORS = ['Navy', 'Charcoal', 'Burgundy', 'Forest', 'Oak'];
export const SHIRT_COLORS = ['Ivory', 'Pale blue', 'Lilac', 'Blush', 'Sage', 'Charcoal'];
export const FACE_SHAPES = ['Oval', 'Angular', 'Rounded'];
export const OUTFITS = [{ id: 'trousers', label: 'Suit with trousers' }, { id: 'skirt', label: 'Suit with skirt' }];

function index(value, options, fallback = 0) { return Number.isInteger(value) && value >= 0 && value < options.length ? value : fallback; }
function color(value, options, fallback = options[0]) { return options.includes(value) ? value : fallback; }

export function normalizeAppearance(value = {}) {
  return {
    skin: index(value.skin, PAL.skin), hair: index(value.hair, PAL.hair),
    hairStyle: index(value.hairStyle, HAIR_STYLES), eye: index(value.eye, PAL.eyes),
    facialHair: index(value.facialHair, FACIAL_HAIR), faceShape: index(value.faceShape, FACE_SHAPES),
    suitColor: color(value.suitColor, PAL.suits), tieColor: color(value.tieColor, PAL.ties),
    shirtColor: color(value.shirtColor, PAL.shirts), outfit: value.outfit === 'skirt' ? 'skirt' : 'trousers',
    silhouette: ['tailored', 'relaxed', 'slim'].includes(value.silhouette) ? value.silhouette : 'tailored',
    glasses: value.glasses === true,
  };
}

// Used everywhere: creator, wardrobe, journal portrait and walking actor.
export function appearanceLook(value, equipped = []) {
  const a = normalizeAppearance(value);
  return { ...a, suit: a.suitColor, shirt: a.shirtColor,
    tie: equipped.includes('tie-brass') ? '#cba64b' : a.tieColor,
    briefcase: equipped.includes('case-oxblood') ? '#713c46' : '#694c35' };
}

export function appearanceDescription(value) {
  const a = normalizeAppearance(value);
  return `${HAIR_COLORS[a.hair]} ${HAIR_STYLES[a.hairStyle].toLowerCase()}, ${FACIAL_HAIR[a.facialHair].toLowerCase()}, ${EYE_COLORS[a.eye].toLowerCase()} eyes, ${a.outfit === 'skirt' ? 'skirt suit' : 'trouser suit'}${a.glasses ? ', glasses' : ''}`;
}
