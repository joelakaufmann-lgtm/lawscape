# LawScape 0.6.0 package verification

Run from a checkout with Node.js 22 or later; no npm dependencies are required:

```sh
npm run build
npm test
npm run release:check
```

The game tests cover avatar rendering and migration, seven zones and their
interactions, 171 scenarios, mail and study time, six writing assignments, two
six-document synthetic matters, the capstone, persistence, rewards and resets.
The static check verifies the browser entry point and generated bundle.

The release check validates the public file allowlist, file sizes and SHA-256
checksums, source/package equality, local documentation and game asset links,
bundled reference files, avatar/world modules and the visible version number.
`dist/release-manifest.json` records every packaged file, version and source
commit. It excludes itself from the checksum list. For local builds the commit
identifies the checkout's HEAD; uncommitted changes are reflected in file hashes.
GitHub Actions builds from a committed checkout.

The playable package includes all seven locations, the expanded attorney
creator, Sidebar and courtroom characters, BarMail, the apprenticeship and
document-review activities, the reference shelf, and the existing demo video.
Avatars and scenery are drawn by the bundled JavaScript, so no external sprite
downloads or model service are needed.

The private `Ethics Agents/` authoring archive is unnecessary for a clean
checkout: the build uses the committed rule snapshot when those sources are
absent. This verifies software and package integrity, not the currentness of
the educational legal content. Multiplayer, live AI grading and hearings remain
planned; the current release saves progress in each player's browser.

New pack tests also cover filtering, saved selections, generated answer keys and stable legacy content.

Before publication, also exercise the packaged build in a fresh browser:
create an attorney, visit all seven zones, answer BarMail, open the journal
and evidence files, interact with Sidebar/courtroom controls, then reload and
continue. Repeat the main flow at a mobile viewport. After publication, compare
the live manifest and asset hashes with the deployment artifact and repeat the
browser smoke test. See [Deployment](DEPLOYMENT.md).
