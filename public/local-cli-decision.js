import {sha256} from './sha256.js';
const digest=value=>sha256(JSON.stringify(value));
const input={lines:[{item:'Synthetic A',quantity:2,unitCents:1250},{item:'Synthetic B',quantity:3,unitCents:500}],expectedTotalCents:4000};
/** Finalize explicit human decisions only for the fixed, independently verified CLI demo.
 * @param {object} job @param {'approve'|'revise'} action @param {string} note @param {string} now
 * @returns {object} A new job snapshot. No model calls or external actions.
 */
export function decideLocalCli(job,action,note,now){
 const inputVersion=digest(input),ruleVersion='local-cli-synthetic-v1',id=digest([inputVersion,ruleVersion]);
 if(job.executor!=='local-cli'||job.source!=='local-cli-demo'||job.ruleVersion!==ruleVersion||job.id!==id||job.inputVersion!==inputVersion||digest(job.input)!==inputVersion||job.validationStatus!=='passed'||!job.result||digest(job.result)!==job.resultVersion)throw Error('입력·규칙·결과 검증에 실패했습니다. 승인하지 않았습니다.');
 const {draft,review,totalCents}=job.result;
 const total=input.lines.reduce((sum,line)=>sum+BigInt(line.quantity)*BigInt(line.unitCents),0n);
 if(totalCents!==Number(total)||draft?.totalCents!==totalCents||review?.totalCents!==totalCents||review.verdict!=='pass'||digest(job.draft)!==digest(draft)||digest(job.review)!==digest(review))throw Error('분석·검토 금액이 일치하지 않아 결정할 수 없습니다.');
 if(job.status!=='awaiting_approval'||job.decision?.action!==null||!['approve','revise'].includes(action)||typeof note!=='string'||note.length>4000||(action==='revise'&&!note.trim())||!Number.isFinite(Date.parse(now)))throw Error('유효한 미결정 업무만 처리할 수 있습니다.');
 return {...job,status:action==='approve'?'approved':'revising',lastCheckedAt:now,decision:{action,note:note.trim(),at:now,jobId:id,inputVersion,ruleVersion,resultVersion:job.resultVersion}};
}
