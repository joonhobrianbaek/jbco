import {mkdir,readFile,writeFile,rename,rm,lstat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {callCli,safeCliDiagnostic} from './cli-demo.mjs';
import {meetingCases,meetingRequest,validateMeetingRequest,createMeetingJob,validateMeetingResult} from '../public/meeting-demo-core.js';
import {sha256} from '../public/sha256.js';
const hash=v=>sha256(JSON.stringify(v));
async function readJson(path){const raw=await readFile(path,'utf8');if(raw.length>1024*1024)throw Error('가상 업무 파일 크기 초과');return JSON.parse(raw);}
async function atomic(path,value){const temp=path+'.'+randomUUID()+'.tmp';try{await writeFile(temp,JSON.stringify(value,null,2)+'\n',{mode:0o600});await rename(temp,path);}finally{await rm(temp,{force:true});}}
/** Process only manually queued fictional meeting presets. No schedules or automatic retries.
 * @param {string} root User-selected demo root.
 * @param {{call?:Function,retry?:boolean,onProgress?:Function}} options
 * @returns {Promise<object[]>} Existing or newly processed jobs.
 */
export async function runMeetingQueue(root,{call=callCli,retry=false,onProgress=()=>{}}={}){
 const results=[];root=resolve(root);
 for(const caseId of Object.keys(meetingCases)){
  const expected=meetingRequest(caseId),dir=join(root,'jobs',expected.id),requestPath=join(dir,'request.json'),path=join(dir,'job.json');let request;
  try{request=validateMeetingRequest(await readJson(requestPath));}catch(error){if(error.code==='ENOENT')continue;throw error;}
  if(request.caseId!==caseId)throw Error('요청 폴더와 업무 ID 불일치');
  if((await lstat(dir)).isSymbolicLink())throw Error('심볼릭 링크 업무 폴더는 실행하지 않습니다.');
  const lock=join(dir,'.lock');try{await mkdir(lock);}catch(error){if(error.code==='EEXIST')throw Error('회의 업무가 이미 실행 중입니다.');throw error;}
  let job;
  try{
   let loaded;try{loaded=await readJson(path);}catch(error){if(error.code!=='ENOENT')throw error;}
   if(loaded&&(loaded.id!==expected.id||loaded.caseId!==caseId||loaded.inputVersion!==expected.inputVersion||hash(loaded.input)!==expected.inputVersion||loaded.ruleVersion!==expected.ruleVersion||loaded.source!=='local-meeting-demo-'+caseId||loaded.taskType!=='synthetic-meeting'||loaded.executor!=='local-cli'))throw Error('접수 기록이 변경되었습니다. 실행하지 않습니다.');
   job=loaded;
   if(job&&job.status!=='received'&&!(retry&&job.status==='failed')){
    if(!['approved','awaiting_approval','revising','failed'].includes(job.status)){job.status='failed';job.validationStatus='failed';job.errorSummary='이전 실행이 중단됐습니다. 원인을 확인한 뒤 명시적으로 재시도하세요.';await atomic(path,job);}
    results.push(job);onProgress(caseId+' · '+job.status+' · 기존 기록 유지');continue;
   }
   const attempt=(job?.attempt||0)+1,previous=job?structuredClone(job):null;
   if(previous)await atomic(join(dir,'attempt-'+attempt+'-before.json'),previous);
   job={...createMeetingJob(request),attempt,status:'planned'};
   const event=async(seat,type,note)=>{job.events.push({seat,type,note,at:new Date().toISOString()});job.lastCheckedAt=new Date().toISOString();await atomic(path,job);onProgress(note);};
   const cwd=join(dir,'work');await mkdir(cwd,{recursive:true});
   await event('gpt-analysis','started','Codex: 가상 회의 메모 정리 시작');job.aiInvoked=true;await atomic(path,job);
   job.draft=await call('codex','Only process these fictional meeting notes. Do not use tools, files, network or take actions. Return JSON only: {"summary":"Korean summary","tasks":[{"id":"T1","action":"Korean action","owner":"exact owner name","due":"YYYY-MM-DD","sourceText":"exact full original note text"}],"decisions":[{"sourceId":"D1","question":"Korean unresolved question","sourceText":"exact full original note text"}]}. Include all action notes once. Do not assign an owner/date to an undecided item. Preserve source IDs and copy sourceText verbatim.\n'+JSON.stringify(job.input),{cwd});
   await atomic(join(dir,'codex-result.json'),job.draft);validateMeetingResult(caseId,job.draft);
   job.status='drafted';await event('gpt-analysis','finished','Codex 정리 완료 · 담당·기한·원문 대조 통과');
   await event('claude-review','started','Claude: 원문과 할 일 목록 교차 검토 시작');
   job.review=await call('claude','Review these fictional meeting notes and draft. Do not use tools, files, network or take actions. Check action meaning, owners, dates, omitted tasks, quoted evidence and unresolved decisions. Return JSON only: {"verdict":"pass" or "fail","checkedSourceIds":["T1","T2","D1"],"note":"Korean review explanation"}. Pass only if the draft accurately represents all notes.\n'+JSON.stringify({input:job.input,draft:job.draft}),{cwd});
   await atomic(join(dir,'claude-review.json'),job.review);validateMeetingResult(caseId,job.draft,job.review);
   job.result={draft:job.draft,review:job.review};job.resultVersion=hash(job.result);job.validationStatus='passed';job.status='awaiting_approval';job.lastSuccessAt=new Date().toISOString();job.outputLinks=['codex-result.json','claude-review.json'];
   await event('claude-review','finished','원문 대조와 Claude 검토 통과 · 대표 승인 대기');results.push(job);
  }catch(error){if(job){job.status='failed';job.validationStatus='failed';job.errorSummary=safeCliDiagnostic(error.message);await atomic(path,job);}throw error;}
  finally{await rm(lock,{recursive:true,force:true});}
 }
 return results;
}
