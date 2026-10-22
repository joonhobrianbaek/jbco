import {timingSafeEqual} from 'node:crypto';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRuntime} from './agents.mjs';
const token=process.env.OFFICE_RUNTIME_TOKEN||'';
const directory=resolve(process.env.OFFICE_DATA_DIR||'./.office-data');
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url)).replace(/\/$/,'');
if(directory===publicRoot||directory.startsWith(publicRoot+sep))throw new Error('OFFICE_DATA_DIR must be outside public/');
const runtime=createRuntime({directory});
const allowed=new Set((process.env.OFFICE_ALLOWED_ORIGINS||'').split(',').filter(Boolean));
export async function api(req,res){
 // Hosting readiness checks must not require the owner's bearer token.
 if(new URL(req.url,'http://runtime').pathname==='/healthz'&&['GET','HEAD'].includes(req.method)){
  try{await runtime.ready;res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:JSON.stringify({ok:true}));}
  catch{res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:JSON.stringify({ok:false}));}
  return true;
 }
 if(!req.url.startsWith('/api/'))return false;
 const origin=req.headers.origin;
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 const send=(code,data)=>{res.writeHead(code,headers);res.end(JSON.stringify(data));};
 if(origin){if(!allowed.has(origin)){send(403,{error:'서버에 허용된 오피스 주소가 아닙니다.'});return true;}headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='Authorization, Content-Type';headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';}
 if(req.method==='OPTIONS'){res.writeHead(204,headers);res.end();return true;}
 const incoming=Buffer.from((req.headers.authorization||'').replace(/^Bearer /,'')),expected=Buffer.from(token);
 if(expected.length<32){send(503,{error:'서버 실행 토큰(32자 이상)을 먼저 설정해주세요.'});return true;}
 if(incoming.length!==expected.length||!timingSafeEqual(incoming,expected)){send(401,{error:'실행 서버 인증을 확인해주세요.'});return true;}
 try{await runtime.ready;const path=new URL(req.url,'http://runtime').pathname;
 const connected=Boolean(process.env.OPENAI_API_KEY&&process.env.ANTHROPIC_API_KEY&&process.env.OPENAI_MODEL&&process.env.ANTHROPIC_MODEL);
 if(req.method==='GET'&&path==='/api/health'){send(200,{connected,limits:{calls:12,outputTokensPerCall:1800,revisions:2},capabilities:['draft','analyze','review'],externalActions:false});return true;}
 if(req.method==='GET'&&path==='/api/runs'){send(200,runtime.list());return true;}
 if(req.method!=='POST'){send(404,{error:'경로를 찾을 수 없습니다.'});return true;}
 let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>64000)throw new Error('요청이 너무 큽니다.');}const data=JSON.parse(body);
 if(path==='/api/runs'){if(!connected){send(503,{error:'서버에 GPT·Claude API 키와 모델을 연결해주세요.'});return true;}send(202,await runtime.create(data.goal));return true;}
 const match=path.match(/^\/api\/runs\/([a-f0-9-]+)\/decision$/);
 if(match){send(200,await runtime.decide(match[1],data.action,data.note));return true;}
 send(404,{error:'경로를 찾을 수 없습니다.'});
 }catch(error){send(400,{error:error instanceof SyntaxError?'요청 형식이 올바르지 않습니다.':error.message});}return true;
}
