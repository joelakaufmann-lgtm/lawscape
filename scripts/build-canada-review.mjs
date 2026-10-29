import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root=new URL('../',import.meta.url);
const raw=await readFile(new URL('canada-test/pack.json',root),'utf8');
const payload={pack:JSON.parse(raw),digest:createHash('sha256').update(raw).digest('hex')};
const template=await readFile(new URL('canada-test/authoring/review.template.html',root),'utf8');
await writeFile(new URL('canada-test/review.html',root),template.replace('__PACK_JSON__',JSON.stringify(payload).replaceAll('<','\\u003c')));
console.log('Built self-contained Canada practitioner review.');
