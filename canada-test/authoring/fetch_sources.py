"""Retrieve only the public primary authorities used in the Canada pilot."""
from pathlib import Path
import urllib.request, json, hashlib, datetime, concurrent.futures

ROOT = Path(__file__).resolve().parents[1] / 'sources'
ITEMS = [
    ('ON-LTB', 'https://tribunalsontario.ca/documents/ltb/Practice%20Directions/Practice%20Direction%20on%20Representation%20before%20the%20LTB.html', 'html'),
    ('BC-3', 'https://www.lawsociety.bc.ca/for-lawyers/act-rules-and-code/code-of-professional-conduct/chapter-3-%E2%80%93-relationship-to-clients/', 'html'),
    ('BC-7', 'https://www.lawsociety.bc.ca/for-lawyers/act-rules-and-code/code-of-professional-conduct/chapter-7-%E2%80%93-relationship-to-the-society-and-other-lawyers/', 'html'),
    ('SK-CODE', 'https://www.lawsociety.sk.ca/wp-content/uploads/CodeOfProfessionalConduct.pdf', 'pdf'),
    ('CA-530', 'https://laws-lois.justice.gc.ca/eng/acts/c-46/section-530.html', 'html'),
]

def fetch(item):
    key, url, ext = item
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=45) as response:
        data = response.read()
        final_url = response.url
        content_type = response.headers.get('Content-Type', '')
    target = ROOT / (key + '.' + ext + ('.source' if ext == 'html' else ''))
    target.write_bytes(data)
    return dict(id=key, url=url, finalUrl=final_url, file=target.name,
                bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                contentType=content_type, status='retrieved; practitioner review pending')

if __name__ == '__main__':
    ROOT.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        receipts = list(pool.map(fetch, ITEMS))
    (ROOT / 'receipt.json').write_text(json.dumps(receipts, indent=2) + '\n')
    print(json.dumps([{'id': item['id'], 'bytes': item['bytes']} for item in receipts]))
