import {api} from './runtime/http.mjs';
import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
const root=fileURLToPath(new URL('./public/',import.meta.url)).replace(/\/$/,'');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.json':'application/json','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{if(await api(req,res))return;try{const urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const path=resolve(root,urlPath==='/'?'index.html':'.'+urlPath);if(!path.startsWith(root+sep))throw new Error('outside');const actual=await realpath(path);if(!actual.startsWith(root+sep)||!(await stat(actual)).isFile())throw new Error('missing');const body=await readFile(actual);res.writeHead(200,{'Content-Type':types[extname(actual)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Arena ready on port '+(process.env.PORT||3000)));
