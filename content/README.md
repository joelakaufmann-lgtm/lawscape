# Questions and reference material

For playable counts and review status, start with [Jurisdictions](../docs/JURISDICTIONS.md).

| Content | Authoring source | Build command |
| --- | --- | --- |
| California | `questions/california/scenarios.json` | `npm run states:build` |
| New York | `questions/new-york/NY_Ethics_Email_Scenarios.md` and `short-scenarios.json` | `npm run states:build` |
| MPRE additions | `questions/mpre/` Markdown | `npm run mpre:build` |
| England & Wales | `questions/england-wales/` Markdown | `npm run sqe:build` |
| Reference shelf | `references/california/`; committed Nevada/Arizona snapshot | `npm run rules:build` |

`npm run build` runs every generator. The original 21 dilemmas and first eight
MPRE adaptations remain hand-authored in `js/data/ethics.js` and `js/data/mpre.js`.
Keep stable question IDs to preserve saved answer history. Generated state-pack
modules and readable answer keys must be committed with their sources.

Source-review notes: [California](questions/california/SOURCES.md),
[New York](questions/new-york/SOURCES.md). Existing reference archives retain
their historical snapshot dates; the new question check does not refresh or
validate every document in those archives.
