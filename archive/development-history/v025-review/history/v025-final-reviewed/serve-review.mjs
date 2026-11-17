import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=import.meta.dirname;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
http.createServer(async(request,response)=>{
  try{
    const url=new URL(request.url,'http://127.0.0.1');
    let name=decodeURIComponent(url.pathname);
    if(name==='/')name='/index.html';
    const pages=new Set(['/index.html','/android-preview/index.html','/android-preview/app.mjs','/android-preview/score-picker.mjs','/android-preview/style.css','/android-preview/layout-v024.css','/previews/windows-preserved.png']);
    if(!pages.has(name)&&!name.startsWith('/android-preview/assets/'))throw Error('Not found');
    const file=path.resolve(root,'.'+name);
    const relative=path.relative(root,file);
    if(relative.startsWith('..')||path.isAbsolute(relative)||!mime[path.extname(file)])throw Error('Not found');
    const bytes=await fs.readFile(file);
    response.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    response.end(bytes);
  }catch{
    response.writeHead(404);response.end('Not found');
  }
}).listen(8876,'127.0.0.1',()=>console.log('PMG review ready at http://127.0.0.1:8876/'));


