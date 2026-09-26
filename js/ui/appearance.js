import { PAL } from '../engine/palette.js';
import { Actor } from '../entities/actor.js';
import { HAIR_STYLES, HAIR_COLORS, FACIAL_HAIR, EYE_COLORS, SKIN_COLORS, TIE_COLORS, SUIT_COLORS, SHIRT_COLORS, FACE_SHAPES, OUTFITS, appearanceLook, appearanceDescription, normalizeAppearance } from '../data/appearance.js';

// One editor for new attorneys and existing characters. No gender-specific limits.
export function mountAppearanceEditor(container, { prefix, read, equipped = () => [], onChange }) {
  const events = new AbortController();
  let category = 'hair', pose = 'stand', facing = 0, frame = 0, disposed = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const groups = {
    hair: { label: 'Hair & grooming', description: 'Choose a silhouette, then make the color your own.', fields: [
      { key: 'hairStyle', label: 'Hair style', choices: HAIR_STYLES },
      { key: 'hair', label: 'Hair color', colors: PAL.hair, names: HAIR_COLORS },
      { key: 'facialHair', label: 'Facial hair', choices: FACIAL_HAIR },
    ] },
    face: { label: 'Face & build', description: 'Human proportions, distinct features, and options open to everyone.', fields: [
      { key: 'faceShape', label: 'Face shape', choices: FACE_SHAPES },
      { key: 'skin', label: 'Skin tone', colors: PAL.skin, names: SKIN_COLORS },
      { key: 'eye', label: 'Eye color', colors: PAL.eyes, names: EYE_COLORS },
      { key: 'silhouette', label: 'Build', choices: ['Tailored', 'Relaxed', 'Slim'], values: ['tailored', 'relaxed', 'slim'] },
      { key: 'glasses', label: 'Glasses', choices: ['Without glasses', 'With glasses'], values: [false, true] },
    ] },
    clothes: { label: 'Suit & colors', description: 'Trousers are the default. A skirt suit is available for any attorney.', fields: [
      { key: 'outfit', label: 'Outfit', choices: OUTFITS.map((item) => item.label), values: OUTFITS.map((item) => item.id) },
      { key: 'suitColor', label: 'Suit color', colors: PAL.suits, names: SUIT_COLORS, hex: true },
      { key: 'shirtColor', label: 'Shirt color', colors: PAL.shirts, names: SHIRT_COLORS, hex: true },
      { key: 'tieColor', label: 'Tie color', colors: PAL.ties, names: TIE_COLORS, hex: true },
    ] },
  };

  container.innerHTML = `<div class="appearance-editor"><section class="avatar-stage" aria-label="Attorney preview"><p class="avatar-eyebrow">Your attorney</p><canvas class="avatar-portrait" width="300" height="360" role="img"></canvas><div class="avatar-facing" role="group" aria-label="Preview angle"><button type="button" data-facing="-1" aria-label="View attorney facing left">↶</button><button type="button" data-facing="0" aria-label="View attorney from the front" aria-pressed="true">Front</button><button type="button" data-facing="1" aria-label="View attorney facing right">↷</button></div><div class="avatar-poses" role="group" aria-label="Preview pose"><button type="button" data-pose="stand" aria-pressed="true">Stand</button><button type="button" data-pose="walk">Walk</button><button type="button" data-pose="sit">Sit</button></div><div class="avatar-world-scale"><canvas width="90" height="96" class="avatar-mini" role="img" aria-label="Attorney at game scale"></canvas><p>In-world size<br><span>Same character, every room.</span></p></div></section><section class="appearance-options"><div class="appearance-tabs" role="tablist" aria-label="Appearance categories">${Object.entries(groups).map(([id, group]) => `<button id="${prefix}-tab-${id}" type="button" role="tab" data-category="${id}" aria-controls="${prefix}-options" aria-selected="${id === category}" tabindex="${id === category ? 0 : -1}">${group.label}</button>`).join('')}</div><div id="${prefix}-options" class="appearance-fields" role="tabpanel" aria-labelledby="${prefix}-tab-hair"></div><p class="appearance-status" role="status" aria-live="polite"></p><p class="appearance-footnote">All identity, hair and clothing choices are free. They never change a grade.</p></section></div>`;
  const fields = container.querySelector('.appearance-fields');
  const portrait = container.querySelector('.avatar-portrait');
  const mini = container.querySelector('.avatar-mini');

  function renderFields() {
    const group = groups[category];
    fields.setAttribute('aria-labelledby', `${prefix}-tab-${category}`);
    fields.innerHTML = `<p class="appearance-intro">${group.description}</p>` + group.fields.map((field) => {
      if (field.choices) return `<div class="appearance-field"><label for="${prefix}-${field.key}">${field.label}</label><div class="appearance-cycle"><button type="button" data-step="-1" data-key="${field.key}" aria-label="Previous ${field.label.toLowerCase()}">‹</button><select id="${prefix}-${field.key}" data-key="${field.key}">${field.choices.map((label, i) => `<option value="${i}">${label}</option>`).join('')}</select><button type="button" data-step="1" data-key="${field.key}" aria-label="Next ${field.label.toLowerCase()}">›</button></div></div>`;
      return `<fieldset class="appearance-field"><legend>${field.label} <span data-color-name="${field.key}"></span></legend><div class="appearance-colors" role="group" aria-label="${field.label}">${field.colors.map((color, i) => `<button type="button" class="appearance-swatch" style="--swatch:${color}" data-key="${field.key}" data-color="${i}" title="${field.names[i]}" aria-label="${field.label}: ${field.names[i]}" aria-pressed="false"><span aria-hidden="true">✓</span></button>`).join('')}</div></fieldset>`;
    }).join('');
    sync();
  }

  function sync() {
    const value = normalizeAppearance(read());
    for (const field of groups[category].fields) {
      if (field.choices) {
        const selected = field.values ? field.values.indexOf(value[field.key]) : value[field.key];
        fields.querySelector(`select[data-key="${field.key}"]`).value = String(selected);
      } else {
        const selected = field.hex ? field.colors.indexOf(value[field.key]) : value[field.key];
        fields.querySelector(`[data-color-name="${field.key}"]`).textContent = field.names[selected];
        fields.querySelectorAll(`[data-key="${field.key}"]`).forEach((btn) => btn.setAttribute('aria-pressed', Number(btn.dataset.color) === selected ? 'true' : 'false'));
      }
    }
    portrait.setAttribute('aria-label', appearanceDescription(value));
    draw(performance.now());
  }

  function draw(now) {
    const look = appearanceLook(read(), equipped());
    const actor = new Actor(0, 0, look);
    actor.facing = facing;
    if (pose === 'sit') { actor.activity = 'sitting'; actor.look.previewSeat = true; }
    if (pose === 'walk') actor.path = [{ x: 1, y: 0 }];
    const time = reducedMotion ? 0.4 : now / 1000;
    const ctx = portrait.getContext('2d');
    ctx.clearRect(0, 0, portrait.width, portrait.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, 360);
    gradient.addColorStop(0, '#233b3a'); gradient.addColorStop(1, '#3d5248');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 300, 360);
    ctx.strokeStyle = 'rgba(216,192,138,.22)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(30, 18, 240, 320, [110,110,5,5]); ctx.stroke();
    ctx.fillStyle = '#657263'; ctx.beginPath(); ctx.ellipse(150, 327, 78, 18, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7c8874'; ctx.beginPath(); ctx.ellipse(150, 319, 78, 17, 0, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(150, 311); ctx.scale(3.6, 3.6);
    actor.draw(ctx, 0, 0, time, true); ctx.restore();
    const small = mini.getContext('2d'); small.clearRect(0, 0, mini.width, mini.height);
    actor.draw(small, 40, 88, time, true);
  }
  function animate(now) {
    if (disposed || !container.isConnected || container.closest('.hidden')) { frame = 0; return; }
    draw(now);
    frame = pose === 'walk' && !reducedMotion ? requestAnimationFrame(animate) : 0;
  }
  function changed(field, i) {
    const value = field.choices ? (field.values ? field.values[i] : i) : field.hex ? field.colors[i] : i;
    const label = field.choices ? field.choices[i] : field.names[i];
    onChange(field.key, value);
    container.querySelector('.appearance-status').textContent = `${field.label}: ${label}`;
    sync();
  }

  container.addEventListener('change', (event) => {
    if (!event.target.matches('select[data-key]')) return;
    const field = groups[category].fields.find((item) => item.key === event.target.dataset.key);
    if (field) changed(field, Number(event.target.value));
  }, { signal: events.signal });
  container.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    if (btn.dataset.category) {
      category = btn.dataset.category;
      container.querySelectorAll('[data-category]').forEach((tab) => { tab.setAttribute('aria-selected', String(tab === btn)); tab.tabIndex = tab === btn ? 0 : -1; });
      renderFields();
    } else if (btn.dataset.facing !== undefined) {
      facing = Number(btn.dataset.facing);
      container.querySelectorAll('[data-facing]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      draw(performance.now());
    } else if (btn.dataset.pose) {
      pose = btn.dataset.pose;
      container.querySelectorAll('[data-pose]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      draw(performance.now());
      if (!frame && pose === 'walk' && !reducedMotion) frame = requestAnimationFrame(animate);
    } else if (btn.dataset.key) {
      const field = groups[category].fields.find((item) => item.key === btn.dataset.key);
      if (!field) return;
      if (btn.dataset.step) {
        const current = Number(fields.querySelector(`select[data-key="${field.key}"]`).value);
        changed(field, (current + Number(btn.dataset.step) + field.choices.length) % field.choices.length);
      } else changed(field, Number(btn.dataset.color));
    }
  }, { signal: events.signal });
  container.querySelector('[role="tablist"]').addEventListener('keydown', (event) => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const tabs = [...container.querySelectorAll('[data-category]')];
    const index = tabs.findIndex((tab) => tab.dataset.category === category);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].click(); tabs[next].focus();
  });
  renderFields();
  return { draw, destroy() { disposed = true; cancelAnimationFrame(frame); events.abort(); } };
}
