import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,rm,readdir,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';

export class TemporaryError extends Error {}
export class InputError extends Error {}
export class ValidationError extends Error {}
const hash=value=>createHash('sha256').update(value).digest('hex');
const stamp=()=>new Date().toISOString();
async function atomic(path,value){const temp=path+'.'+randomUUID()+'.tmp';try{await writeFile(temp,JSON.stringify(value,null,2)+'\n',{mode:0o600});await rename(temp,path);}finally{await rm(temp,{force:true});}}
export function calculateInvoice(input){
 if(!input||!Array.isArray(input.lines)||input.lines.length===0)throw new InputError('항목 자료가 필요합니다.');
 let totalCents=0;const lines=input.lines.map((line,index)=>{
  if(!line||typeof line.item!=='string'||!line.item.trim()||!Number.isSafeInteger(line.quantity)||line.quantity<=0||!Number.isSafeInteger(line.unitCents)||line.unitCents<0)throw new InputError(`${index+1}행 품목·수량·단가를 확인해주세요.`);
  const amountCents=line.quantity*line.unitCents;totalCents+=amountCents;
  if(!Number.isSafeInteger(amountCents)||!Number.isSafeInteger(totalCents))throw new InputError('계산 가능한 금액 범위를 초과했습니다.');
  return {...line,amountCents};
 });return {lines,totalCents};
}
export function validateInvoice(input,result){
 const expected=calculateInvoice(input);
 if(JSON.stringify(expected)!==JSON.stringify(result))throw new ValidationError('항목·금액 검증 불일치');
 if(!Number.isSafeInteger(input.expectedTotalCents))throw new InputError('원본 대조 합계가 필요합니다.');
 if(result.totalCents!==input.expectedTotalCents)throw new ValidationError('원본 대조 합계와 계산 합계가 다릅니다.');
 return {status:'passed',expectedTotalCents:input.expectedTotalCents,actualTotalCents:result.totalCents};
}
export async function createLocalJobs(root,{processInput=calculateInvoice,validate=validateInvoice,maxAttempts=3,retryMs=1000}={}){
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||!Number.isFinite(retryMs)||retryMs<0)throw Error('잘못된 재시도 설정');
 root=resolve(root);const checkout=await realpath(new URL('../',import.meta.url).pathname);
 await mkdir(root,{recursive:true,mode:0o700});root=await realpath(root);
 if(root===checkout||!relative(checkout,root).startsWith('..')&&!isAbsolute(relative(checkout,root)))throw Error('업무 저장소는 코드 저장소 밖에 두세요.');
 const jobs=resolve(root,'jobs');await mkdir(jobs,{recursive:true,mode:0o700});
 const pathFor=id=>{if(!/^[a-f0-9]{64}$/.test(id))throw Error('잘못된 업무 ID');return resolve(jobs,id);};
 const read=id=>readFile(resolve(pathFor(id),'job.json'),'utf8').then(JSON.parse);
 async function locked(id,operation){const dir=pathFor(id),lock=resolve(dir,'.lock');try{await mkdir(lock);}catch(error){if(error.code==='EEXIST')throw Error('다른 실행이 업무를 처리 중입니다.');throw error;}try{return await operation(dir);}finally{await rm(lock,{recursive:true,force:true});}}
 async function save(dir,job){job.updatedAt=stamp();await atomic(resolve(dir,'job.json'),job);}
 function event(job,type,note){job.events.push({at:stamp(),seat:'gpt-analysis',type,note});}
 return {
 async register(source,input,ruleVersion='synthetic-invoice-v1'){
  if(typeof source!=='string'||!source.trim()||typeof ruleVersion!=='string'||!ruleVersion)throw Error('입력 식별자와 규칙 버전이 필요합니다.');
  const serialized=JSON.stringify(input),inputVersion=hash(serialized),id=hash(JSON.stringify([source,inputVersion,ruleVersion])),dir=pathFor(id);
  await mkdir(dir,{recursive:true,mode:0o700});
  return locked(id,async()=>{try{return await read(id);}catch(error){if(error.code!=='ENOENT')throw error;}
   await mkdir(resolve(dir,'input'),{recursive:true});await atomic(resolve(dir,'input/source.json'),input);
   const job={id,title:'가상 청구 검증: '+source,source,taskType:'synthetic-invoice',inputVersion,ruleVersion,status:'received',plan:[{step:'draft',seat:'gpt-analysis',executor:'manual',status:'pending'}],events:[],decision:{action:null,note:'',at:null},createdAt:stamp(),attemptCount:0,nextRetryAt:null,validationStatus:'unrun',outputLinks:[],errorSummary:null};
   await save(dir,job);return job;
  });
 },
 read,
 async run(id){return locked(id,async dir=>{
  const job=await read(id);
  if(!['received','retry_pending'].includes(job.status))return job;
  if(job.nextRetryAt&&Date.parse(job.nextRetryAt)>Date.now())return job;
  job.attemptCount++;job.status='working';job.startedAt=stamp();job.lastCheckedAt=stamp();event(job,'started','가상 자료 코드 처리');await save(dir,job);
  try{
   if(job.ruleVersion!=='synthetic-invoice-v1')throw new InputError('지원되지 않는 규칙 버전입니다.');
   const raw=await readFile(resolve(dir,'input/source.json'),'utf8'),input=JSON.parse(raw);
   if(hash(JSON.stringify(input))!==job.inputVersion)throw new ValidationError('보존 입력이 변경되었습니다. 새 버전으로 접수하세요.');
   const result=await processInput(input);job.status='validating';job.lastCheckedAt=stamp();await save(dir,job);
   const verification=await validate(input,result);
   if(verification?.status!=='passed')throw new ValidationError('검증 완료가 확인되지 않았습니다.');
   await mkdir(resolve(dir,'work'),{recursive:true});await atomic(resolve(dir,'work/result.json'),result);await atomic(resolve(dir,'work/validation.json'),verification);
   job.validationStatus='passed';job.outputLinks=['work/result.json','work/validation.json'];job.status='awaiting_approval';job.nextRetryAt=null;job.errorSummary=null;job.lastSuccessAt=stamp();event(job,'finished','가상 합계 검증 완료. 대표 결정 대기');
  }catch(error){
   if(!(error instanceof InputError||error instanceof ValidationError||error instanceof TemporaryError)){
    job.status='failed';job.errorSummary='예상하지 못한 처리 오류: '+error.message;event(job,'error',job.errorSummary);await save(dir,job);throw error;
   }
   job.errorSummary=error.message;
   if(error instanceof InputError){job.status='waiting_input';event(job,'question',error.message);}
   else if(error instanceof TemporaryError&&job.attemptCount<maxAttempts){job.status='retry_pending';job.nextRetryAt=new Date(Date.now()+retryMs).toISOString();event(job,'error',error.message);}
   else{job.status='failed';job.validationStatus=error instanceof ValidationError?'failed':'unrun';job.nextRetryAt=null;event(job,'error',error.message);}
  }
  job.finishedAt=stamp();await save(dir,job);return job;
 });},
 async applyDecision(id){return locked(id,async dir=>{const job=await read(id);if(job.status!=='awaiting_approval'||job.decision.action===null)return job;if(!['approve','revise'].includes(job.decision.action)||typeof job.decision.note!=='string'||!Number.isFinite(Date.parse(job.decision.at)))throw Error('결정 기록을 확인해주세요.');if(job.decision.action==='approve'){if(job.validationStatus!=='passed')throw Error('검증되지 않은 결과');for(const otherId of await readdir(jobs)){if(otherId===id||!/^[a-f0-9]{64}$/.test(otherId))continue;const other=await read(otherId);if(other.source===job.source&&other.createdAt>=job.createdAt)throw Error('새 입력 또는 규칙 버전이 접수되었습니다. 이전 결과는 확정할 수 없습니다.');}}job.status=job.decision.action==='approve'?'approved':'revising';await save(dir,job);return job;});},
 async summary(){
  const all=[];for(const id of await readdir(jobs)){if(!/^[a-f0-9]{64}$/.test(id))continue;all.push(await read(id));}
  return all.map(job=>({...job,isLatest:!all.some(other=>other.source===job.source&&other.taskType===job.taskType&&other.id!==job.id&&other.createdAt>=job.createdAt),needsInspection:['working','validating'].includes(job.status)&&Date.now()-Date.parse(job.lastCheckedAt)>300000}));
 }
 };
}
