import {sha256} from './sha256.js';
/** Browser/Node synthetic worker. Uses no model API, company input or network. */
export const demoCases={
 normal:{lines:[{item:'가상 품목 A',quantity:2,unitCents:1250},{item:'가상 품목 B',quantity:3,unitCents:500}],expectedTotalCents:4000},
 missing:{lines:[{item:'가상 누락 단가',quantity:2}]},
 mismatch:{lines:[{item:'가상 불일치',quantity:1,unitCents:100}],expectedTotalCents:200}
};
async function digest(value){return sha256(JSON.stringify(value));}
/** Execute an allowlisted synthetic case, then independently reconcile using BigInt. */
export async function executeSynthetic(caseName,now=new Date().toISOString()){
 if(!Object.hasOwn(demoCases,caseName))throw new Error('허용된 가상 업무만 실행할 수 있습니다.');
 if(!Number.isFinite(Date.parse(now)))throw new Error('잘못된 실행 시각');
 const input=structuredClone(demoCases[caseName]),inputVersion=await digest(input),ruleVersion='browser-synthetic-v1',id=await digest([caseName,inputVersion,ruleVersion]);
 const job={id,title:'[가상 업무] '+({normal:'청구 합계 검증',missing:'필수 자료 확인',mismatch:'합계 불일치 검증'})[caseName],source:'browser-demo-'+caseName,taskType:'synthetic-invoice',executor:'browser-code',aiInvoked:false,input,inputVersion,ruleVersion,status:'received',plan:[{step:'calculate',seat:'gpt-analysis',executor:'browser-code'},{step:'independent-review',seat:'gpt-analysis',executor:'browser-code'}],events:[],decision:{action:null,note:'',at:null},validationStatus:'unrun',lastCheckedAt:now,createdAt:now};
 const event=(type,note)=>job.events.push({at:now,seat:'gpt-analysis',type,note});event('started','가상 입력 접수. 브라우저 코드 실행, AI 호출 없음.');
 if(input.lines.some(l=>!Number.isSafeInteger(l.quantity)||l.quantity<=0||!Number.isSafeInteger(l.unitCents)||l.unitCents<0)||!Number.isSafeInteger(input.expectedTotalCents)){
  job.status='waiting_input';job.errorSummary='필수 단가 또는 원본 대조 합계가 없습니다.';event('question',job.errorSummary);return job;
 }
 const lines=input.lines.map(l=>({...l,amountCents:l.quantity*l.unitCents})),totalCents=lines.reduce((n,l)=>n+l.amountCents,0);
 if(!Number.isSafeInteger(totalCents))throw new Error('안전한 금액 범위 초과');
 const independent=input.lines.reduce((n,l)=>n+BigInt(l.quantity)*BigInt(l.unitCents),0n);
 job.result={lines,totalCents};job.verification={method:'independent-bigint-reconciliation',actualTotalCents:independent.toString(),expectedTotalCents:input.expectedTotalCents};
 if(independent!==BigInt(totalCents)||independent!==BigInt(input.expectedTotalCents)){job.status='failed';job.validationStatus='failed';job.errorSummary='계산 합계와 원본 대조 합계가 일치하지 않습니다.';event('error',job.errorSummary);return job;}
 job.status='awaiting_approval';job.validationStatus='passed';job.lastSuccessAt=now;event('finished','독립 합계 검증 통과. 대표 승인 전에는 확정하지 않습니다.');return job;
}
/** Bind explicit human approval to exactly this input and rule version. */
export async function decideSynthetic(job,action,note,now=new Date().toISOString()){
 if(job.status!=='awaiting_approval'||job.decision.action!==null||!['approve','revise'].includes(action)||typeof note!=='string'||note.length>4000||!Number.isFinite(Date.parse(now)))throw new Error('미결정 승인 대기 업무만 처리할 수 있습니다.');
 if(action==='revise'&&!note.trim())throw new Error('수정 사유가 필요합니다.');
 const caseName=job.source?.replace('browser-demo-','');const verified=await executeSynthetic(caseName,job.createdAt);
 if(job.inputVersion!==await digest(job.input)||job.inputVersion!==verified.inputVersion||job.id!==verified.id||job.ruleVersion!==verified.ruleVersion||job.validationStatus!=='passed'||verified.validationStatus!=='passed'||JSON.stringify(job.result)!==JSON.stringify(verified.result))throw new Error('입력·규칙·결과가 변경되어 승인할 수 없습니다.');
 return {...structuredClone(job),status:action==='approve'?'approved':'revising',decision:{action,note:note.trim(),at:now,jobId:job.id,inputVersion:job.inputVersion,ruleVersion:job.ruleVersion}};
}
