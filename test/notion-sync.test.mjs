import test from 'node:test';
import assert from 'node:assert/strict';
import {planNotionSync,taskId} from '../runtime/notion-sync.mjs';
const row = {'작업 ID':'1','프로젝트':'가상 업무 데모','업무명':'[가상 업무] 예시',url:'https://app.notion.com/p/'+'a'.repeat(32)};
const job = {id:'b'.repeat(64),source:'demo-complete',taskType:'synthetic-invoice',inputVersion:'c'.repeat(64),ruleVersion:'synthetic-invoice-v1',status:'awaiting_approval',validationStatus:'passed',lastCheckedAt:'2026-10-22T12:00:00Z',lastSuccessAt:'2026-10-22T12:01:00Z'};
const bind = [{taskId:'BB-1',jobId:job.id}];
test('explicit IDs yield repeatable updates; no auto-ID, links, owners or decision writes',()=>{
 const plan=planNotionSync([job],[row],bind);
 assert.deepEqual(plan,planNotionSync([job],[{...row,'상태':'완료'}],bind));
 assert.equal(plan[0].properties['상태'],'대표 결정 대기');
 assert.equal(plan[0].properties['검증 상태'],'통과');
 assert.equal(plan[0].properties['date:마지막 성공 시각:start'],job.lastSuccessAt);
 assert.equal(plan[0].taskId,'BB-1');
 for(const key of ['작업 ID','담당','decision','원본 링크','결과물 링크']) assert.equal(key in plan[0].properties,false);
});
test('missing and duplicate bindings/IDs fail before any external write',()=>{
 assert.throws(()=>planNotionSync([job],[row],[{taskId:'2',jobId:job.id}]),/찾을 수/);
 assert.throws(()=>planNotionSync([job],[row,row],bind),/중복/);
 assert.throws(()=>planNotionSync([job],[row],[...bind,...bind]),/중복/);
 assert.throws(()=>planNotionSync([job,job],[row],bind),/중복/);
 assert.throws(()=>taskId('1 OR 1'),/유효/);
});
test('real records, non-demo inputs, approvals, invalid timestamps and contradictory validation rejected',()=>{
 assert.throws(()=>planNotionSync([job],[{...row,'프로젝트':'실제 업무'}],bind),/가상/);
 for(const change of [{source:'production'},{status:'approved'},{lastCheckedAt:'bad'},{validationStatus:'failed'},{inputVersion:'bad'}]) assert.throws(()=>planNotionSync([{...job,...change}],[row],bind));
});
test('waiting input and failure retain absence of success; no invented timestamps',()=>{
 for(const [status,validationStatus,expected] of [['waiting_input','unrun','자료 대기'],['failed','failed','실패']]) {
  const plan=planNotionSync([{...job,status,validationStatus,lastSuccessAt:undefined}],[row],bind);
  assert.equal(plan[0].properties['상태'],expected);
  assert.equal('date:마지막 성공 시각:start' in plan[0].properties,false);
 }
 assert.throws(()=>planNotionSync([{...job,lastSuccessAt:undefined}],[{...row,'date:마지막 성공 시각:start':job.lastSuccessAt}],bind),/수동 검토/);
});
