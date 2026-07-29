// Dialogue box: speaker + text + choice buttons. The same component drives
// interviews, task offers, shops entry points, and flavor conversations.

const $ = (id) => document.getElementById(id);

export function showDialogue({ name, text, choices = [] }) {
  $('dialogue-name').textContent = name;
  $('dialogue-text').textContent = text;
  const wrap = $('dialogue-choices');
  wrap.innerHTML = '';
  const all = choices.length ? choices : [{ label: 'Goodbye', fn: hideDialogue }];
  for (const c of all) {
    const btn = document.createElement('button');
    btn.textContent = c.label;
    btn.onclick = () => {
      hideDialogue();
      if (c.fn) c.fn();
    };
    wrap.appendChild(btn);
  }
  $('dialogue').classList.remove('hidden');
}

export function hideDialogue() {
  $('dialogue').classList.add('hidden');
}

export function dialogueOpen() {
  return !$('dialogue').classList.contains('hidden');
}
