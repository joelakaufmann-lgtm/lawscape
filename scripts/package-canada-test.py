"""Build an explicitly scoped, portable Canada review ZIP. Run after the site build."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT / 'release'
NAME = 'lawscape-canada-test-0.1.0'
RELEASE.mkdir(exist_ok=True)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def put(stage, relative, text):
    target = stage / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text)


def copy(stage, relative):
    source = ROOT / relative
    target = stage / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.is_symlink():
        raise ValueError('Refusing symlink: ' + relative)
    shutil.copy2(source, target)


with tempfile.TemporaryDirectory(prefix='lawscape-canada-package-') as temp:
    stage = Path(temp) / NAME
    shutil.copytree(ROOT / 'dist', stage)
    # The site-only manifest is replaced by the complete archive inventory below.
    (stage / 'release-manifest.json').unlink()
    for source in (ROOT / 'js').rglob('*.js'):
        copy(stage, source.relative_to(ROOT).as_posix())
    for source in (ROOT / 'tests').glob('*.test.mjs'):
        copy(stage, source.relative_to(ROOT).as_posix())
    for name in ['build.mjs', 'build-canada.mjs', 'build-canada-review.mjs', 'check.mjs', 'verify-canada-package.mjs']:
        copy(stage, 'scripts/' + name)
    for name in ['DESIGN.md', 'overview.plan.json', 'overview.spec.json', 'overview.skeleton.json', 'create_overview.py', 'review.template.html', 'fetch_sources.py']:
        copy(stage, 'canada-test/authoring/' + name)
    for name in ['browser.mjs', 'overview-interactions.mjs', 'browser-report.json', 'overview-interactions-report.json', 'unit-tests.log', 'build.log', 'release-check.log', 'palette-check.txt']:
        copy(stage, 'canada-test/tests/' + name)
    for name in json.loads((ROOT / 'canada-test/tests/browser-report.json').read_text())['screenshots']:
        copy(stage, 'canada-test/tests/' + name)

    # The portable server serves only this curated archive, on the loopback interface.
    server = (ROOT / 'scripts/serve-canada-test.mjs').read_text()
    server = server.replace("'../dist'", "'..'").replace('process.env.PORT||8767', 'process.env.PORT||8000')
    server = server.replace('// Serves only the packaged public/test files, never the repository or authoring folder.', '// Serves this curated review archive locally; binds only to 127.0.0.1.')
    put(stage, 'scripts/serve.mjs', server)
    package = {
        'name': 'lawscape-canada-review', 'version': '0.1.0', 'private': True,
        'description': 'Local Canada review pack on LawScape 0.6.0; practitioner review pending.',
        'type': 'module', 'engines': {'node': '>=22'},
        'scripts': {
            'build': 'node scripts/build-canada.mjs && node scripts/build-canada-review.mjs && node scripts/build.mjs',
            'test': 'node --test tests/*.test.mjs && node scripts/check.mjs',
            'check': 'node scripts/check.mjs',
            'start': 'node scripts/serve.mjs',
            'release:check': 'node scripts/verify-canada-package.mjs'
        }
    }
    put(stage, 'package.json', json.dumps(package, indent=2) + '\n')
    roadmap = (ROOT / 'ROADMAP.md').read_text().split('## Planned — Canada:', 1)[1].split('\n## ', 1)[0]
    roadmap = '# Canada roadmap\n\nExcerpt from the project roadmap for this review build.\n\n## Canada:' + roadmap
    roadmap = roadmap.replace('canada-test/review.html', 'review.html').replace('canada-test/overview.html', 'overview.html')
    roadmap = roadmap.replace('planning/canada-integration-feedback.md', 'PLAN-FEEDBACK.md')
    put(stage, 'canada-test/CANADA-ROADMAP.md', roadmap + '\n')
    feedback = (ROOT / 'planning/canada-integration-feedback.md').read_text()
    feedback = re.sub(r'\([^)]*ROADMAP.md[^)]*\)', '(CANADA-ROADMAP.md)', feedback)
    put(stage, 'canada-test/PLAN-FEEDBACK.md', '> Historical planning feedback. The 25 questions and five emails are now authored and integrated locally; practitioner legal validation is still pending.\n\n' + feedback)

    put(stage, 'START-HERE.md', '''# LawScape Canada — practitioner review package

**25 ethics questions · five email assignments · local test · legal approval pending**

Extract the ZIP first. Then open **canada-test/review.html** for all exercises and reviewer notes, **canada-test/overview.html** for the editable meeting overview, or **index.html** to play. Choose **Journal → Firm jurisdictions → Canada · TEST PACK** in the game. No account, installation or server is needed to open these HTML files.

## Executive summary

The proposal is a good start. This pilot turns its five topics into short, reviewable learning exercises: Ontario LTB representation, BC referrals, BC recording notice, Saskatchewan criminal language rights, and BC undertakings/trust conditions. Each topic has five multiple-choice questions and one 100–200-word email assignment. Canadian office settings, language needs and provincial practice details provide the theme. The roadmap now records the local pilot and the practitioner review still needed before wider release.

Every option has an explanation. Each email has fictional records, a sample reply, a proposed 10-point human-review rubric and discussion points. Free text is not automatically graded. Canadian test answers have no Ethics, gold or streak effects. Existing game activities outside this pack retain their usual effects.

## Review together

1. Start with the overview, then open the full review page.
2. Record reviewer name, proposed status and notes for each exercise. Notes save in this browser; export Markdown or JSON to share them manually.
3. Confirm the proposed key, exceptions, current rule and jurisdiction for all 30 exercises. The included source receipt is evidence of retrieval, not legal validation.
4. Keep the entire folder together. Use synthetic examples only in the practice fields. No text is emailed or automatically synced.

Read [the curriculum guide](canada-test/README.md), [questions and key](canada-test/QUESTIONS.md), [email assignments](canada-test/EMAILS.md), [sources](canada-test/SOURCES.md), [technical QA](canada-test/QA.md), [roadmap](canada-test/CANADA-ROADMAP.md) and [original plan feedback](canada-test/PLAN-FEEDBACK.md).

## Optional local server and editing

With Node 22 or later, run `npm start` from this extracted folder and visit `http://127.0.0.1:8000/canada-test/review.html`. No npm install is required. The server binds only to this computer. Use `PORT=8773 npm start` on macOS/Linux if port 8000 is occupied.

Edit `canada-test/pack.json`, then run `npm run build` and `npm test`. This regenerates the game data, Markdown books, full review HTML and game bundle. Existing legacy curriculum is included as generated modules; the original private reference workspace is not required. Browser QA scripts require a separately available Playwright installation and Chrome; set PLAYWRIGHT_MODULE and CHROME_PATH as needed. Those optional tools are not needed to play, rebuild or run the 51 automated tests.

The overview can be edited and saved directly in its browser editor. Its plan, specification and palette are included for authors who have the LegalDesign skill; rebuilding that shared overview runtime from its specification requires that skill. Editing the overview does not change the curriculum or confer legal approval.

`npm run release:check` checks the original full-file SHA-256 inventory. It intentionally reports changes after editing any inventoried file. Re-running optional browser tests also changes their evidence files. Keep an untouched copy when comparing integrity. The manifest covers every payload file except itself; the adjacent ZIP checksum covers the complete archive.

## Scope and provenance

This is an English-language pilot across five topics in three provinces. No practitioner has signed off, and no legal accreditation or regulator endorsement is claimed. It is a local study build with visible answer keys. No public deployment or message to the practitioner has been made.

Base game: LawScape 0.6.0. Pilot: canada-0.1.0-review. This archive is a snapshot of local additions, not a committed production release. PACKAGE-VALIDATION.json records the separate standalone build/test checks. The original public-source files retain their publishers' applicable terms; the project licence does not relicense third-party legal sources.
''')
    put(stage, 'README.md', '# LawScape Canada review\n\nStart with [START-HERE.md](START-HERE.md). Open [the review page](canada-test/review.html), [the overview](canada-test/overview.html) or [the game](index.html).\n')

    generated = ['canada-test/pack.json', 'js/data/canada.js', 'js/lawscape.bundle.js', 'canada-test/review.html', 'canada-test/QUESTIONS.md', 'canada-test/EMAILS.md', 'canada-test/SOURCES.md']
    before = {name: digest((stage / name).read_bytes()) for name in generated}
    checks = []
    for args, filename in [(['npm', 'run', 'build'], 'archive-build.log'), (['npm', 'test'], 'archive-tests.log')]:
        run = subprocess.run(args, cwd=stage, text=True, capture_output=True)
        put(stage, 'canada-test/tests/' + filename, run.stdout + run.stderr)
        if run.returncode:
            raise RuntimeError('Standalone check failed: ' + ' '.join(args) + '\n' + run.stdout + run.stderr)
        checks.append({'command': ' '.join(args), 'exitCode': run.returncode, 'log': 'canada-test/tests/' + filename})
    after = {name: digest((stage / name).read_bytes()) for name in generated}
    if before != after:
        raise RuntimeError('Standalone rebuild changed the shipped content')
    pack = json.loads((stage / 'canada-test/pack.json').read_text())
    assert len(pack['questions']) == 25 and len(pack['emails']) == 5
    validation = {
        'checkedAt': datetime.now(timezone.utc).isoformat(),
        'commands': checks, 'automatedTestsPassed': 51,
        'standaloneRebuildByteIdentical': True,
        'questions': 25, 'emailAssignments': 5,
        'legalApproval': 'pending', 'deployment': 'local only',
        'packageInventory': 'SHA-256 inventory verified by Node and by reopening every ZIP entry before delivery'
    }
    put(stage, 'PACKAGE-VALIDATION.json', json.dumps(validation, indent=2) + '\n')
    inventory = []
    for file in sorted(stage.rglob('*')):
        if file.is_symlink():
            raise ValueError('Symlink in package')
        if not file.is_file():
            continue
        data = file.read_bytes()
        relative = file.relative_to(stage).as_posix()
        if b'/Users/' in data or b'/private/tmp/' in data or b'file:///' in data:
            raise ValueError('Machine-specific path in ' + relative)
        inventory.append({'path': relative, 'bytes': len(data), 'sha256': digest(data)})
    manifest = {
        'package': NAME, 'packVersion': pack['version'],
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'baseGameVersion': '0.6.0', 'baseCommit': '06265cb20a48183d16bb029246566e3e0fa1a8f7',
        'snapshotStatus': 'Uncommitted local test additions; the base commit is not the pilot build identity.',
        'contentSha256': digest((stage / 'canada-test/pack.json').read_bytes()),
        'legalApproval': 'pending', 'files': inventory
    }
    put(stage, 'MANIFEST.json', json.dumps(manifest, indent=2) + '\n')
    subprocess.run(['node', 'scripts/verify-canada-package.mjs'], cwd=stage, check=True)
    archive = RELEASE / (NAME + '.zip')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=8) as output:
        for file in sorted(stage.rglob('*')):
            if file.is_file():
                output.write(file, NAME + '/' + file.relative_to(stage).as_posix())
    with zipfile.ZipFile(archive) as output:
        assert output.testzip() is None
        expected = {NAME + '/' + item['path']: item for item in inventory}
        assert set(output.namelist()) == set(expected) | {NAME + '/MANIFEST.json'}
        for name, item in expected.items():
            data = output.read(name)
            assert len(data) == item['bytes'] and digest(data) == item['sha256']
    checksum = digest(archive.read_bytes())
    archive.with_suffix('.zip.sha256').write_text(checksum + '  ' + archive.name + '\n')
    (RELEASE / (NAME + '-validation.json')).write_text(json.dumps({
        **validation, 'zipEntries': len(inventory) + 1, 'bytes': archive.stat().st_size,
        'zipSha256': checksum, 'allZipEntriesMatchInventory': True
    }, indent=2) + '\n')
    print(json.dumps({'archive': str(archive), 'files': len(inventory) + 1, 'bytes': archive.stat().st_size, 'sha256': checksum, 'standaloneTests': 51}, indent=2))
