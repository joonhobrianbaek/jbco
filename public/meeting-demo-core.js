import {sha256} from './sha256.js';
const hash=value=>sha256(JSON.stringify(value));
export const meetingRule='synthetic-meeting-v1';
export const meetingCases={
 reading:{title:'가상 독서 모임 준비',notes:[
  {id:'T1',text:'Mina는 2026-11-05까지 가상 독서 모임의 책 후보 세 권을 정리한다.'},
  {id:'T2',text:'Jun은 2026-11-06까지 가상 참가 신청서 초안을 작성한다.'},
  {id:'D1',text:'온라인과 오프라인 중 어떤 방식으로 진행할지는 아직 결정하지 않았다.'}
 ],expected:[{id:'T1',owner:'Mina',due:'2026-11-05'},{id:'T2',owner:'Jun',due:'2026-11-06'}]},
 exhibition:{title:'가상 전시 준비',notes:[
  {id:'T1',text:'Alex는 2026-11-12까지 가상 전시의 포스터 초안을 만든다.'},
  {id:'T2',text:'Sora는 2026-11-13까지 가상 전시에 쓸 작품 목록을 정리한다.'},
  {id:'D1',text:'가상 전시의 제목은 아직 정하지 않았다.'}
 ],expected:[{id:'T1',owner:'Alex',due:'2026-11-12'},{id:'T2',owner:'Sora',due:'2026-11-13'}]}
};
/** Build an immutable request identity for an allowlisted fictional meeting. */
export function meetingRequest(caseId){
 if(!Object.hasOwn(meetingCases,caseId))throw Error('허용된 가상 회의만 접수할 수 있습니다.');
 const c=meetingCases[caseId],input={title:c.title,notes:structuredClone(c.notes)},inputVersion=hash(input);
 return {id:hash([caseId,inputVersion,meetingRule]),caseId,inputVersion,ruleVersion:meetingRule};
}
export function validateMeetingRequest(request){
 if(!request||JSON.stringify(request)!==JSON.stringify(meetingRequest(request.caseId)))throw Error('가상 요청의 ID·입력·규칙이 변경됐습니다.');
 return request;
}
/** Create an unexecuted local record. This does not invoke AI. */
export function createMeetingJob(request,now=new Date().toISOString()){
 validateMeetingRequest(request);if(!Number.isFinite(Date.parse(now)))throw Error('잘못된 접수 시각');
 const c=meetingCases[request.caseId];
 return {...request,title:'[가상 업무] '+c.title+' · 할 일 정리',source:'local-meeting-demo-'+request.caseId,taskType:'synthetic-meeting',executor:'local-cli',input:{title:c.title,notes:structuredClone(c.notes)},status:'received',validationStatus:'unrun',aiInvoked:false,plan:[],events:[],decision:{action:null,note:'',at:null},createdAt:now,lastCheckedAt:now};
}
/** Validate model output against independent, fixed source facts. Prose still needs human review. */
export function validateMeetingResult(caseId,draft,review){
 const c=meetingCases[meetingRequest(caseId).caseId];
 if(!draft||typeof draft.summary!=='string'||!draft.summary.trim()||draft.summary.length>1000||!Array.isArray(draft.tasks)||draft.tasks.length!==c.expected.length||!Array.isArray(draft.decisions)||draft.decisions.length!==1)throw Error('회의 요약 형식 또는 항목 수가 맞지 않습니다.');
 const ids=new Set();
 for(const task of draft.tasks){const expected=c.expected.find(t=>t.id===task.id),source=c.notes.find(n=>n.id===task.id);if(!expected||ids.has(task.id)||task.owner!==expected.owner||task.due!==expected.due||task.sourceText!==source.text||typeof task.action!=='string'||!task.action.trim()||task.action.length>500)throw Error('할 일의 담당·기한·원문 근거가 맞지 않습니다.');ids.add(task.id);}
 const decision=draft.decisions[0];
 if(decision.sourceId!=='D1'||decision.sourceText!==c.notes.find(n=>n.id==='D1').text||typeof decision.question!=='string'||!decision.question.trim()||decision.question.length>500)throw Error('미결정 항목의 원문 근거가 맞지 않습니다.');
 if(arguments.length>=3&&(!review||review.verdict!=='pass'||typeof review.note!=='string'||review.note.length>2000||!Array.isArray(review.checkedSourceIds)||JSON.stringify([...review.checkedSourceIds].sort())!==JSON.stringify(c.notes.map(n=>n.id).sort())))throw Error('Claude의 원문 대조 검토를 통과하지 못했습니다.');
 return true;
}
/** Bind one human decision to the exact request and reviewed result, without CLI execution. */
export function decideMeeting(job,action,note,now){
 const request=meetingRequest(job.caseId),original=createMeetingJob(request,job.createdAt);
 if(job.source!==original.source||job.executor!=='local-cli'||job.taskType!=='synthetic-meeting'||job.id!==request.id||job.ruleVersion!==meetingRule||job.inputVersion!==request.inputVersion||hash(job.input)!==request.inputVersion||job.validationStatus!=='passed'||!job.result||hash(job.result)!==job.resultVersion||hash(job.draft)!==hash(job.result.draft)||hash(job.review)!==hash(job.result.review))throw Error('회의 입력 또는 결과가 바뀌어 결정할 수 없습니다.');
 validateMeetingResult(job.caseId,job.result.draft,job.result.review);
 if(job.status!=='awaiting_approval'||job.decision.action!==null||!['approve','revise'].includes(action)||typeof note!=='string'||note.length>4000||(action==='revise'&&!note.trim())||!Number.isFinite(Date.parse(now)))throw Error('유효한 미결정 업무만 결정할 수 있습니다.');
 return {...job,status:action==='approve'?'approved':'revising',lastCheckedAt:now,decision:{action,note:note.trim(),at:now,jobId:job.id,inputVersion:job.inputVersion,ruleVersion:job.ruleVersion,resultVersion:job.resultVersion}};
}
