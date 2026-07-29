# Contributing to LawScape

Thanks for helping improve LawScape.

## Local workflow

1. Run `npm start` and open `http://127.0.0.1:8000`.
2. Edit the source modules under `js/`, plus `index.html` or `css/style.css`.
3. Run `npm run build` to refresh the browser bundle and deployment package.
4. Run `npm test` before opening a pull request.

`js/lawscape.bundle.js` is generated. Please edit the source modules rather
than the bundle.

If you change a local ethics-rule authoring file, run `npm run rules:build`
before the normal build. Review the generated `js/data/rules.js` for snapshot
dates, source labels, and official links.

## Scenario contributions

Ethics scenarios belong in `js/data/ethics.js`. Each scenario needs:

- a unique identifier;
- a clear jurisdiction/rule reference;
- exactly one defensible correct answer;
- an explanation for every incorrect answer; and
- neutral, educational wording that does not present the game as legal advice.

Please cite primary legal authority in the pull-request description when adding
or materially changing a scenario.

MPRE-style contributions must be original adaptations, clearly identified as
unofficial practice material, and linked to NCBE’s public preparation page.
Do not copy secure, recalled, or live examination questions. Place new
adaptations in `js/data/mpre.js`.

## Pull requests

Keep changes focused, describe the player-facing effect, and include the output
of `npm test`. Screenshots are useful for visible interface changes.
