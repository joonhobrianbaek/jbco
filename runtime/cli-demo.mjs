import {spawn} from 'node:child_process';
import {access,mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {resolve,join,delimiter,extname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const input={lines:[{item:'Synthetic A',quantity:2,unitCents:1250},{item:'Synthetic B',quantity:3,unitCents:500}],expectedTotalCents:4000};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ruleVersion='local-cli-synthetic-v1';
/** Resolve a local CLI without searching the current working directory. */
export async function resolveCli(name){
 const suffixes=process.platform==='win32'?['.exe','.cmd','.bat','']:[''];
 for(const dir of (process.env.PATH||'').split(delimiter).filter(Boolean))for(const suffix of suffixes){const path=resolve(dir,name+suffix);try{await access(path);return path;}catch(error){if(!['ENOENT','ENOTDIR'].includes(error.code))throw error;}}
 throw new Error(`${name} CLI not found on PATH.`);
}
/** Spawn a bounded one-shot CLI; prompts go through stdin, never shell interpolation. */
export async function callCli(provider,prompt,{cwd,timeoutMs=300000}={}){
 const exe=await resolveCli(provider==='codex'?'codex':'claude');
 const args=provider==='codex'?['exec','--sandbox','read-only','--skip-git-repo-check','--json','-']:['-p','--output-format','json','--tools','','--disallowedTools','mcp__*'];
 const batch=process.platform==='win32'&&['.cmd','.bat'].includes(extname(exe).toLowerCase());
 if(batch&&/["%!&|<>^\r\n]/.test(exe))throw new Error('Unsupported CLI wrapper path. Use a native executable or a simple installation path.');
 const command=batch?(process.env.ComSpec||'cmd.exe'):exe;
 const argv=batch?['/d','/s','/c',`""${exe}" ${args.map(a=>'"'+a+'"').join(' ')}"`]:args;
 const output=await new Promise((accept,reject)=>{
  const child=spawn(command,argv,{cwd,windowsHide:true,windowsVerbatimArguments:batch,shell:false,stdio:['pipe','pipe','pipe']});let stdout='',stderr='',bytes=0,settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):accept(value);};
  const timer=setTimeout(()=>{child.kill();finish(new Error(`${provider} timed out. Check the local CLI before retrying.`));},timeoutMs);
  child.on('error',error=>finish(new Error(`${provider} launch failed: ${error.message}`)));
  child.stdout.on('data',data=>{bytes+=data.length;if(bytes>2*1024*1024){child.kill();finish(new Error('CLI output exceeded 2 MB.'));}else stdout+=data.toString();});
  child.stderr.on('data',data=>{stderr=(stderr+data.toString()).slice(-4000);});
  child.stdin.on('error',()=>{});
  child.on('close',code=>finish(code===0?null:new Error(`${provider} exited ${code}. ${safeCliDiagnostic(stderr||stdout)}`),stdout));
  child.stdin.end(prompt);
 });
 return parseCliOutput(provider,output);
}
/** Bound local error details and redact common credential forms before persistence. */
export function safeCliDiagnostic(value){
 return String(value).replace(/(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]+/g,'[REDACTED]').replace(/(Bearer\s+)\S+/gi,'$1[REDACTED]').replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization)["']?\s*[:=]\s*["']?)[^\s"',}]+/gi,'$1[REDACTED]').slice(-2000).trim()||'No diagnostic output. Test the CLI directly.';
}
/** Extract only the model's final response from CLI JSON/JSONL. */
export function parseCliOutput(provider,output){
 let text;
 if(provider==='codex'){
  for(const line of output.split(/\r?\n/).filter(Boolean)){let item;try{item=JSON.parse(line);}catch{continue;}if(item.type==='item.completed'&&item.item?.type==='agent_message')text=item.item.text;}
 }else{const envelope=JSON.parse(output);if(envelope.is_error)throw new Error('Claude reported an execution error.');text=envelope.structured_output||envelope.result;}
 if(typeof text==='object'&&text!==null)return text;
 if(typeof text!=='string'||text.length>20000)throw new Error('CLI final response missing or oversized.');
 const parsed=JSON.parse(text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('CLI result must be a JSON object.');return parsed;
}
async function atomic(path,data){const temp=path+'.'+randomUUID()+'.tmp';try{await writeFile(temp,JSON.stringify(data,null,2)+'\n',{mode:0o600});await rename(temp,path);}finally{await rm(temp,{force:true});}}
/** Run Codex analysis, Claude review and independent validation on fixed synthetic input only. */
export async function runCliDemo(root,{call=callCli,retry=false}={}){
 root=resolve(root);const inputVersion=hash(input),id=hash([inputVersion,ruleVersion]),dir=join(root,'jobs',id),path=join(dir,'job.json');await mkdir(dir,{recursive:true});
 const lock=join(dir,'.lock');try{await mkdir(lock);}catch(error){if(error.code==='EEXIST')throw new Error('This job is already running.');throw error;}
 let job;
 try{
  try{job=JSON.parse(await readFile(path,'utf8'));if(!retry||job.status!=='failed'){if(job.status==='awaiting_approval'&&job.decision.action!==null){if(job.inputVersion!==inputVersion||hash(job.input)!==inputVersion||job.ruleVersion!==ruleVersion||hash(job.result)!==job.resultVersion||job.result.totalCents!==4000||job.validationStatus!=='passed'||job.decision.jobId!==id||job.decision.inputVersion!==inputVersion||job.decision.ruleVersion!==ruleVersion||!['approve','revise'].includes(job.decision.action)||!Number.isFinite(Date.parse(job.decision.at)))throw new Error('Decision or result version changed.');job.status=job.decision.action==='approve'?'approved':'revising';await atomic(path,job);}return job;}}catch(error){if(error.code!=='ENOENT')throw error;}
  job={id,title:'[가상 업무] Codex 분석 → Claude 검토',source:'local-cli-demo',taskType:'synthetic-invoice',executor:'local-cli',input:structuredClone(input),inputVersion,ruleVersion,status:'received',plan:[],events:[],decision:{action:null,note:'',at:null},validationStatus:'unrun',aiInvoked:false,createdAt:new Date().toISOString(),lastCheckedAt:new Date().toISOString()};
  const event=async(seat,type,note)=>{job.events.push({seat,type,note,at:new Date().toISOString()});job.lastCheckedAt=new Date().toISOString();await atomic(path,job);};
  const cwd=join(dir,'work');await mkdir(cwd,{recursive:true});await atomic(join(dir,'input.json'),input);
  await event('gpt-analysis','started','Codex CLI 호출 시작. 고정 가상 입력만 전달.');
  const draft=await call('codex','Use only the synthetic JSON below. Do not use tools, read files or access the network. Compute invoice total in integer cents. Return JSON only: {"totalCents":number,"summary":string}. No actions or approvals.\n'+JSON.stringify(input),{cwd});
  job.aiInvoked=true;job.draft=draft;await atomic(join(dir,'codex-result.json'),draft);await event('gpt-analysis','finished','Codex CLI 응답 저장. 검증 전 결과.');
  await event('claude-review','started','Claude CLI로 가상 입력과 Codex 결과를 교차 검토.');
  const review=await call('claude','Review the following synthetic invoice and draft independently. No tools, external actions or approvals. Return JSON only: {"verdict":"pass" or "fail","totalCents":number,"note":string}.\n'+JSON.stringify({input,draft}),{cwd});
  job.review=review;await atomic(join(dir,'claude-review.json'),review);
  const total=input.lines.reduce((n,l)=>n+BigInt(l.quantity)*BigInt(l.unitCents),0n);
  if(!Number.isSafeInteger(draft.totalCents)||!Number.isSafeInteger(review.totalCents)||review.verdict!=='pass'||BigInt(draft.totalCents)!==total||BigInt(review.totalCents)!==total||total!==BigInt(input.expectedTotalCents))throw new Error('Independent reconciliation failed. No approval is possible.');
  job.validationStatus='passed';job.status='awaiting_approval';job.lastSuccessAt=new Date().toISOString();job.result={totalCents:Number(total),draft,review};job.resultVersion=hash(job.result);job.outputLinks=['codex-result.json','claude-review.json'];await event('claude-review','finished','독립 BigInt 대사 통과. 대표 승인 대기.');return job;
 }catch(error){if(job){job.status='failed';job.validationStatus='failed';job.errorSummary=error.message;job.events.push({seat:'gpt-analysis',type:'error',note:error.message,at:new Date().toISOString()});await atomic(path,job);}throw error;}
 finally{await rm(lock,{recursive:true,force:true});}
}
