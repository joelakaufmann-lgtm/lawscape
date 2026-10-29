# Publish LawScape on GitHub Pages

The public game is at https://joelakaufmann-lgtm.github.io/lawscape/.
Pages uses GitHub Actions and publishes only the `dist/` artifact.
`scripts/site-files.mjs` defines the public allowlist; authoring archives,
local saves, Git metadata and development tools stay outside that artifact.

1. Obtain the owner's instruction to publish the release. Run the commands in
   [Build verification](BUILD.md) and exercise the packaged game in a browser.
2. Commit the complete release, push it, and confirm the **Validate** workflow
   succeeds. Merge or fast-forward the approved release to `main`.
3. Run **Deploy LawScape to GitHub Pages** on `main`, with `approved` set to true:

   ```sh
   gh workflow run pages.yml --repo joelakaufmann-lgtm/lawscape --ref main -f approved=true
   ```

4. Confirm both build and deployment succeed. Fetch `release-manifest.json`
   from the public URL and verify its commit matches the published `main`.
   Check the actual bundle hash, visible version, attorney creator, locations,
   BarMail and journal on the public site in a fresh browser session.

Review-branch pushes do not publish. The deployment workflow accepts `main`
only and runs build, tests and package validation before uploading the site.
No hosting secret or token is included in browser code.

## Rollback

Record the last working deployment's commit before publishing. If the new
release fails, revert the release on `main` with a new commit (preserving the
working deployment workflow and verifier), run all checks, and deploy that
commit through the same manual workflow. Keep Git history intact. Verify the
live manifest and game again after rollback.

## Existing saves

The homepage is `index.html`; the playable game is `game.html` on the same origin.
The `lawscape_save_v2` browser-storage key remains unchanged. The game's
additive migration preserves existing supported saves. Saves made on a local
file, another hostname or another browser do not automatically transfer to
GitHub Pages. If an old page is cached, reload the page before playing.
