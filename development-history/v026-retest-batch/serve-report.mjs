import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
const root=import.meta.dirname;
const manifest=JSON.parse(await fsp.readFile(path.join(root,'report/asset-manifest.json'),'utf8'));
const allowed=new Map([['/report/retest-report.html',path.join(root,'report/retest-report.html')]]);
for(const asset of manifest.assets){const relative=path.relative(root,asset.fullPath);if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Asset outside test folder');allowed.set(new URL(asset.relativeURL,'http://localhost/report/retest-report.html').pathname,asset.fullPath);}
const mime={'.html':'text/html; charset=utf-8','.png':'image/png','.webm':'video/webm'};
http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.writeHead(302,{Location:'/report/retest-report.html'});res.end();return;}
 const file=allowed.get(url.pathname);if(!file)throw Error('not found');
 const {size}=await fsp.stat(file);let start=0,end=size-1,status=200;
 const range=req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
 if(req.headers.range&&!range){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return;}
 if(range){status=206;if(range[1]){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),size-1):size-1;}else{start=Math.max(0,size-Number(range[2]));}if(start>=size||end<start){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return;}}
 const headers={'Content-Type':mime[path.extname(file)],'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 res.writeHead(status,headers);if(req.method==='HEAD'){res.end();return;}fs.createReadStream(file,{start,end}).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(8877,'127.0.0.1',()=>console.log('Evidence report: http://127.0.0.1:8877/'));
