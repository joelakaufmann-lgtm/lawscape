import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Serves only the packaged public/test files, never the repository or authoring folder.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const port=Number(process.env.PORT||8767);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.source':'text/plain; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const file=path.resolve(root,pathname==='/'?'index.html':pathname.replace(/^\/+/,''));
    if(!file.startsWith(root+path.sep)||(await stat(file)).isDirectory()){res.writeHead(404).end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});createReadStream(file).pipe(res);
  }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Canada test site: http://127.0.0.1:${port}/canada-test/review.html`));
