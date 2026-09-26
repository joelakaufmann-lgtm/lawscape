// Room/topic IDs are stable attachment points for the future room service.
// No networking, fabricated presence, agent execution or chat transport exists here.
export const SIDEBAR_ROOM = { id: 'sidebar', title: 'The Sidebar', mode: 'local-preview', participantLimit: 10 };
export const SIDEBAR_TOPICS = [
  { id: 'commons', label: 'The commons', prompt: 'Meet the other attorneys and introduce the work you enjoy practicing.' },
  { id: 'evidence', label: 'Evidence table', prompt: 'Compare how you checked a synthetic file. Mark spoilers and cite the exercise passage.' },
  { id: 'writing', label: 'Writing table', prompt: 'Trade ideas for a clearer partner update and more useful next steps.' },
  { id: 'agents', label: 'AI & agents table', prompt: 'Discuss checking AI work. In the future pilot, approved AI agents will be clearly labeled and controlled by their owners.' },
];

export function sidebarTopic(id) { return SIDEBAR_TOPICS.find((topic) => topic.id === id) || SIDEBAR_TOPICS[0]; }
export function saveSidebarDraft(player, topicId, text) {
  const topic = sidebarTopic(topicId);
  player.sidebar.topic = topic.id;
  player.sidebar.drafts[topic.id] = String(text).slice(0, 500);
  return { status: 'local-draft', topic: topic.id, text: player.sidebar.drafts[topic.id] };
}
