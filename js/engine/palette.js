// Single source of truth for every color in the game world (see docs/archive/VISUAL_DESIGN.md §2).
export const PAL = {
  marble: '#e8e4da',
  marbleDark: '#d6d0c2',
  stone: '#9a958c',
  stoneDark: '#7d786f',
  wood: '#8b5e3c',
  woodLight: '#a97a52',
  woodDark: '#6b4529',
  parchment: '#f3e9d2',
  brass: '#b8912f',
  brassLight: '#d9b656',
  navy: '#1f3a5f',
  navyLight: '#2c5085',
  burgundy: '#6e2436',
  burgundyLight: '#8d3449',
  archiveGreen: '#3f5d4b',
  archiveGreenLight: '#557a63',
  ink: '#2b2b33',
  grass: '#6a8f57',
  grassDark: '#5a7c49',
  water: '#5b87a6',
  skin: ['#f2d6b3', '#e8c39e', '#d4a373', '#c68e5f', '#a06a42', '#8d5a3b', '#5f3d28'],
  // Append shades so existing saved color indices retain their meaning.
  hair: ['#2b2b33', '#6b4529', '#b8912f', '#9a958c', '#8c3b2e', '#e8e2d4',
    '#3a261d', '#8a5434', '#c59b63', '#b96b3d', '#d0ab85', '#69645e',
    '#4b4650', '#1d2c38', '#592d3b', '#334763', '#715278', '#ad7789'],
  eyes: ['#4a3728', '#3b6ea5', '#4a7c59', '#8c6b3f', '#7a8288', '#b3541e'],
  suits: ['#1f3a5f', '#3a3a42', '#6e2436', '#3f5d4b', '#8b5e3c'],
  ties: ['#6e2436', '#253d65', '#3f6252', '#a68238', '#66537d', '#2f6670', '#b18672', '#34363c', '#bac3d2', '#ece1c5', '#944b3f', '#486886'],
  shirts: ['#f3eee1', '#c8d8e6', '#d4c6d8', '#e2c9c1', '#d4d9d0', '#363b45'],
};

// Lighten (amt > 0) or darken (amt < 0) a hex color. Used to fake 3-tone flat shading.
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `rgb(${r},${g},${b})`;
}
