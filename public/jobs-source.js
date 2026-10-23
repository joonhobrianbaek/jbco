import {employees} from './employees.js';
const seats=new Set(employees.map(e=>e.id));
const statuses=new Set(['received','planned','drafted','reviewed','awaiting_approval','revising','approved','failed','waiting_input','retry_pending','validating']);
export function validateJob(job){
 if(!job||typeof job.id!=='string'||!job.id||typeof job.title!=='string'||!job.title.trim()||!statuses.has(job.status)||!Array.isArray(job.events)||!Array.isArray(job.plan)||!job.decision||![null,'approve','revise'].includes(job.decision.action))throw Error('업무 형식을 확인해주세요.');
 for(const e of job.events)if(!e||!seats.has(e.seat)||!['started','finished','question','error'].includes(e.type)||!Number.isFinite(Date.parse(e.at)))throw Error('직원 또는 이벤트 형식이 잘못되었습니다.');
 return job;
}
export function jobStates(jobs){return jobs.flatMap(job=>{
 validateJob(job);const last=new Map();for(const e of job.events)last.set(e.seat,e);
 const states=[...last].map(([seat,e])=>({seat,state:job.status==='failed'?'error':job.status==='approved'?'done':({started:'working',finished:'done',question:'question',error:'error'})[e.type],jobId:job.id,title:job.title}));
 if(job.status==='awaiting_approval')states.push({seat:'muse-video',state:'approval',jobId:job.id,title:job.title});return states;
});}
export async function readJobs(directory){
 const entries=[],errors=[],ids=new Set();
 for await(const [name,handle]of directory.entries()){
 if(handle.kind!=='directory')continue;
 try{const file=await handle.getFileHandle('job.json');const snapshot=await (await file.getFile()).text();if(snapshot.length>1024*1024)throw Error('업무 파일이 너무 큽니다.');const job=validateJob(JSON.parse(snapshot));if(ids.has(job.id))throw Error('중복 업무 ID');ids.add(job.id);entries.push({job,handle,snapshot});}
 catch(error){errors.push({name,message:error.message});}
 }return {entries,errors};
}
// Re-read before writing: never overwrite an observed external update.
export async function writeDecision(entry,action,note,now=new Date().toISOString()){
 if(!['approve','revise'].includes(action)||typeof note!=='string'||note.length>4000||(action==='revise'&&!note.trim()))throw Error('수정 사유를 포함한 올바른 결정을 입력해주세요.');
 const file=await entry.handle.getFileHandle('job.json');const current=await (await file.getFile()).text();
 if(current!==entry.snapshot)throw Error('파일이 변경되었습니다. 새로고침 후 다시 결정해주세요.');
 const job=validateJob(JSON.parse(current));if(job.status!=='awaiting_approval'||job.decision.action!==null)throw Error('미결정 승인 대기 업무만 결정할 수 있습니다.');
 const updated={...job,decision:{action,note:note.trim(),at:now,...(job.executor==='local-cli'?{jobId:job.id,inputVersion:job.inputVersion,ruleVersion:job.ruleVersion}:{})}};
 const writer=await file.createWritable();try{await writer.write(JSON.stringify(updated,null,2)+'\n');await writer.close();}catch(error){await writer.abort().catch(()=>{});throw error;}
 return updated;
}
