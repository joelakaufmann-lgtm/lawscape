# LawScape — Visual Design & World Structure

A practical planning document for artists, designers, and developers. LawScape is a law-themed
isometric RPG in the *spirit* of classic browser MMORPGs — compact, readable, click-driven —
with entirely original art, UI, maps, and characters. The world's job is to make law feel like
an explorable system: every building, document, person, and object suggests a possible legal action.

Tone: **legal fantasy board game**, not a realistic legal simulator. Serious materials, playful
proportions, satisfying clicks.

---

## 1. Camera & World Layout

- **Projection:** fixed-angle isometric, 2:1 diamond tiles (64×32 px on screen). No camera
  rotation. The camera smoothly follows the player.
- **Movement:** click-to-move. Clicking a walkable tile paths the attorney there (A* over the
  tile grid). Clicking an NPC or object paths to it, then interacts.
- **Zones:** compact, hand-authored rooms of roughly 10×10 to 22×22 tiles, connected by door
  **portals**. Small zones keep every interaction one or two screens away — the world should
  feel dense and quest-driven, never empty.

### MVP world graph

```
                [Courthouse]        (locked until Reputation 30)
                     |
[Law Office] — [Justice Square] — [Law Library]
                     |
                [Apartment]
```

- **Justice Square** — outdoor hub. Cobblestone plaza, central fountain, the public **notice
  board** (task board), benches, lampposts, topiary. Four building facades around the plaza
  mark the exits; each has a clearly lit door.
- **Law Office** — the professional hub. Every prop is upgrade-reactive (see §7 of the game plan).
- **Courthouse** — marble lobby + courtroom. Gated behind reputation; a bailiff turns away
  unproven attorneys at the door.
- **Law Library** — the "research dungeon": tall shelf stacks form corridors, reading tables
  in clearings, a pedestal holding a rare authority at the far end.
- **Apartment** — the personal hub: Focus recovery and cosmetics.

### Readability rules (hard requirements)

1. Every interactive thing has a distinct silhouette and a hover highlight.
2. Interactive NPCs/nodes show an overhead indicator (see §4). Nothing interactive hides
   behind occluding geometry.
3. Portals glow softly and carry a floating label on hover.
4. Ground materials encode function: cobble = travel, marble = ceremony, wood = work,
   green carpet = research, rug = home.

### Post-MVP zones (paper designs only for now)

- **Clerk's Office** — filing & procedure zone: queue ropes, stamping counters, pneumatic tubes.
- **Jail / Detention Center** — criminal-law quests: visitation booths, evidence lockers.
- **Legislature / Agency** — rulemaking zone: hearing chamber, comment boxes, register scrolls.
- **Mediation Room** — negotiation arena: round table, neutral grey-green palette.
- **Appellate Tower** — vertical late-game challenge; each floor a higher court, panoramic top.
- **AI Lab** — glass-and-brass workshop of humming model terminals for legal-AI challenges.

---

## 2. Art Style

- **Faked low-poly in 2D:** everything is drawn procedurally on canvas as layered polygons.
  Each volume gets exactly **three tones** — light top, mid left face, dark right face — which
  reads as chunky flat-shaded 3D. No gradients on surfaces, no textures, no image assets.
- **Chunky props:** slightly oversized doors, columns, and books. A casebook should read at
  a glance from full zoom-out.
- **Palette** (named constants in `js/engine/palette.js` — all colors in the game come from here):

| Name | Hex | Used for |
|---|---|---|
| marble | `#e8e4da` | courthouse floors, columns |
| stone | `#9a958c` | plaza, walls, benches |
| wood | `#8b5e3c` | office floors, desks, shelves |
| parchment | `#f3e9d2` | UI panels, documents, paper props |
| brass | `#b8912f` | fittings, lamps, quest icons, highlights |
| navy | `#1f3a5f` | suits, courthouse accents, UI headers |
| burgundy | `#6e2436` | robes, rugs, apartment accents, seals |
| archiveGreen | `#3f5d4b` | library shelves and carpet |
| ink | `#2b2b33` | outlines, text, shadows |

- **Lighting:** implied top-left sun. Every standing object drops a soft ellipse shadow.
- **Mood:** smart, warm, lightly satirical. Never grimdark, never clip-art cartoon.

---

## 3. Key Locations (MVP interiors)

| Zone | Floor | Signature props | Interactions |
|---|---|---|---|
| Justice Square | cobble + grass | fountain, notice board, benches, lampposts | notice board = task list, portals |
| Law Office | wood + rug | desk (3 visual tiers), computer/monitors, case board, bookshelf, client chair, filing cabinet; upgrades add seating area, paralegal desk, conference table | client NPC offers matters; computer opens the office upgrade shop |
| Courthouse | marble checker | judge's bench, witness stand, counsel tables, gallery benches, clerk's counter, scales statue | judge offers high-tier tasks; clerk flavor dialogue; bailiff gates the door |
| Law Library | archive-green carpet | shelf stacks (corridors), reading tables, rare-authority pedestal | shelves are research nodes → citation games; librarian offers tasks |
| Apartment | wood + rug | bed (tiers), coffee machine, wardrobe, kitchenette, desk nook, plant, city window | bed = rest (Focus), coffee = boost, wardrobe = outfits, catalog = apartment shop |

---

## 4. Characters & NPCs

- **Player avatar:** simple layered figure — shadow, legs, suit-colored body, hands, head with
  skin/hair presets, briefcase in the right hand. Four facing directions, two-frame walk bob.
  Wardrobe upgrades recolor the suit; late-game robes and pins are additive layers.
- **MVP NPC cast:** Judge (courtroom), Clerk (courthouse lobby), Bailiff (courthouse door),
  Client (office), Librarian (library). Post-MVP archetypes: opposing counsel, investigator,
  expert witness, mediator, professor, regulator, journalist, court reporter.
- **Overhead indicators:**
  - gold **§** — task/quest available here
  - parchment dot — dialogue only
  - name label on hover (NPCs and nodes alike)

---

## 5. Objects & Interaction — legal resource nodes

Legal objects replace fantasy gathering nodes. Clicking a node opens dialogue, a panel, or
launches its mapped mini-game:

| Node | Where | Acts like | Launches |
|---|---|---|---|
| Notice board | Square | quest board | task list |
| Casebook shelves | Library | mining node | Citation Chase |
| Rare-authority pedestal | Library | rare spawn | high-tier Citation Chase |
| Client chair | Office | quest giver seat | Issue Spotter matters |
| Computer / AI workstation | Office | crafting bench | Hallucination Hunt; office shop |
| Filing cabinet | Office | storage | inventory flavor |
| Docket terminal | Courthouse | quest board | courthouse tasks |
| Bed / coffee / wardrobe | Apartment | rest & cosmetics | Focus, outfits |

Documents are items: the inventory holds evidence, authorities, filings, and credentials, and
future puzzles treat them as tools, keys, shields, and weapons.

---

## 6. User Interface

DOM overlay above the canvas, parchment-and-brass theme, ink text.

- **HUD (top bar):** money (coin), reputation (scales), Focus (coffee cup) + zone name.
- **Minimap (top right):** drawn like a courthouse/city floor plan — walkable area in parchment,
  walls in ink, portals as brass dots, player as a burgundy dot.
- **Case Docket (quest journal):** numbered matters with status stamps (OPEN / CLOSED),
  plus tabs for the inventory grid and the skill panel.
- **Skill panel:** Research, AI, Advocacy in the MVP; the full ladder later adds Negotiation,
  Investigation, Drafting, Procedure, Ethics, Strategy.
- **Dialogue box (bottom):** speaker name plate + text + choice buttons; the same component
  drives interviews, task offers, shops, and (later) hearings and settlement talks.
- **Mini-game overlay:** full-screen parchment panel with task prompt, timer, interactive
  area, submit button; followed by a results screen (score, money, reputation, skill XP,
  mistakes and bonuses).

---

## 7. Core Visual Metaphor (design commandments)

Check every future zone, prop, and mechanic against this table:

| Legal thing | Game metaphor |
|---|---|
| Library | dungeon of precedent |
| Court | boss arena |
| Statute | ancient rulebook |
| Contract | puzzle object |
| Evidence room | vault |
| Appeal | climbing a tower |
| Argument | structured attack/defense: objections, citations, procedural moves |
| Filing deadline | timed event |
| Research subscription | equipment tier |
| Reputation | character level / access key |

---

*LawScape is a fictional educational game. It is not legal advice and does not create an
attorney-client relationship.*
