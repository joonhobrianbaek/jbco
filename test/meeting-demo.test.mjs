import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {meetingCases,meetingRequest,createMeetingJob,validateMeetingResult,decideMeeting} from '../public/meeting-demo-core.js';
import {runMeetingQueue} from '../runtime/meeting-demo.mjs';
import {enqueueMeeting} from '../public/meeting-queue.js';
import {writeDecision} from '../public/jobs-source.js';
async function fixture(t,caseId='reading'){
 const root=await mkdtemp(join(tmpdir(),'bb-meeting-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const request=meetingRequest(caseId),dir=join(root,'jobs',request.id);await mkdir(dir,{recursive:true});await writeFile(join(dir,'job.json'),JSON.stringify(createMeetingJob(request)));await writeFile(join(dir,'request.json'),JSON.stringify(request));return {root,dir,caseId};
}
function outputs(caseId='reading'){
 const c=meetingCases[caseId];return {draft:{summary:'가상 회의 요약',tasks:c.expected.map(t=>({...t,action:c.notes.find(n=>n.id===t.id).text,sourceText:c.notes.find(n=>n.id===t.id).text})),decisions:[{sourceId:'D1',question:'진행 방식을 결정해주세요.',sourceText:c.notes.find(n=>n.id==='D1').text}]},review:{verdict:'pass',checkedSourceIds:['T1','T2','D1'],note:'원문 대조 통과'}};
}
test('manual queue runs two providers, preserves source facts, deduplicates and binds approval',async t=>{
 const {root,dir}=await fixture(t);let calls=0;const o=outputs(),call=async p=>{calls++;return structuredClone(p==='codex'?o.draft:o.review);};
 const [job]=await runMeetingQueue(root,{call});assert.equal(calls,2);assert.equal(job.status,'awaiting_approval');assert.equal(job.validationStatus,'passed');assert.equal(job.aiInvoked,true);assert.equal(job.result.draft.tasks[1].owner,'Jun');
 await runMeetingQueue(root,{call});assert.equal(calls,2);
 const approved=decideMeeting(job,'approve','확인',new Date().toISOString());assert.equal(approved.status,'approved');assert.equal(approved.decision.resultVersion,job.resultVersion);await writeFile(join(dir,'job.json'),JSON.stringify(approved));await runMeetingQueue(root,{call,retry:true});assert.equal(calls,2);
});
test('wrong owner, missing task, invented evidence and duplicate IDs fail independent validation',()=>{
 for(const change of [d=>d.tasks[0].owner='Other',d=>d.tasks.pop(),d=>d.tasks[0].sourceText='invented',d=>d.tasks[1].id='T1',d=>d.decisions=[]]){const {draft,review}=outputs();change(draft);assert.throws(()=>validateMeetingResult('reading',draft,review));}
 assert.throws(()=>meetingRequest('../company'));
 const o=outputs();assert.throws(()=>validateMeetingResult('reading',o.draft,undefined));
});
test('review rejection persists failure; only explicit retry can invoke models again',async t=>{
 const {root,dir}=await fixture(t),o=outputs();let calls=0;await assert.rejects(runMeetingQueue(root,{call:async p=>{calls++;return p==='codex'?o.draft:{...o.review,verdict:'fail'};}}),/Claude/);
 assert.equal((JSON.parse(await readFile(join(dir,'job.json')))).status,'failed');await runMeetingQueue(root,{call:async()=>{throw Error('must not call');}});assert.equal(calls,2);
 const [j]=await runMeetingQueue(root,{retry:true,call:async p=>p==='codex'?o.draft:o.review});assert.equal(j.status,'awaiting_approval');assert.equal(j.attempt,2);assert.equal(JSON.parse(await readFile(join(dir,'attempt-2-before.json'))).status,'failed');
});
test('input mutation is rejected before any model call and never overwritten',async t=>{
 const {root,dir}=await fixture(t),path=join(dir,'job.json'),j=JSON.parse(await readFile(path));j.input.notes[0].text='company data';const raw=JSON.stringify(j);await writeFile(path,raw);await assert.rejects(runMeetingQueue(root,{call:async()=>{throw Error('must not call');}}),/변경/);assert.equal(await readFile(path,'utf8'),raw);
});
test('crash state becomes explicit failed status without automatic replay',async t=>{const {root,dir}=await fixture(t),path=join(dir,'job.json'),j=JSON.parse(await readFile(path));j.status='planned';await writeFile(path,JSON.stringify(j));const [saved]=await runMeetingQueue(root,{call:async()=>{throw Error('must not call');}});assert.equal(saved.status,'failed');assert.match(saved.errorSummary,/중단/);});
test('concurrent run is rejected by job lock',async t=>{const {root}=await fixture(t),o=outputs();let start,release;const started=new Promise(r=>start=r),pause=new Promise(r=>release=r);const first=runMeetingQueue(root,{call:async p=>{start();await pause;return p==='codex'?o.draft:o.review;}});await started;await assert.rejects(runMeetingQueue(root),/이미 실행/);release();await first;});
function browserFolder(name='jobs'){
 const children=new Map(),files=new Map();let writes=0;
 const handle={name,kind:'directory',getDirectoryHandle:async n=>{if(!children.has(n))children.set(n,browserFolder(n));return children.get(n).handle;},getFileHandle:async(n,options={})=>{if(!files.has(n)&&!options.create)throw Object.assign(Error('missing'),{name:'NotFoundError'});if(!files.has(n))files.set(n,'');return {getFile:async()=>({text:async()=>files.get(n)}),createWritable:async()=>({write:async text=>{files.set(n,text);writes++;},close:async()=>{},abort:async()=>{}})};}};
 return {handle,children,files,get writes(){return writes;}};
}
test('browser intake saves local request once and never overwrites reviewed results',async()=>{const folder=browserFolder(),first=await enqueueMeeting(folder.handle,'reading');assert.equal(first.job.status,'received');assert.equal(first.job.aiInvoked,false);const child=folder.children.get(first.job.id);assert.equal(child.writes,2);const stored=JSON.parse(child.files.get('job.json'));stored.status='approved';child.files.set('job.json',JSON.stringify(stored));const again=await enqueueMeeting(folder.handle,'reading');assert.equal(again.reused,true);assert.equal(again.job.status,'approved');assert.equal(child.writes,2);await assert.rejects(enqueueMeeting(browserFolder('individual-job').handle,'reading'),/jobs/);});
test('site decision writer finalizes meeting result and blocks result tampering',async t=>{const {root}=await fixture(t),o=outputs(),[job]=await runMeetingQueue(root,{call:async p=>p==='codex'?o.draft:o.review}),folder=browserFolder();folder.files.set('job.json',JSON.stringify(job));const entry={handle:folder.handle,snapshot:folder.files.get('job.json')};const saved=await writeDecision(entry,'approve','검토');assert.equal(saved.status,'approved');const changed=structuredClone(job);changed.result.draft.tasks[0].owner='Other';assert.throws(()=>decideMeeting(changed,'approve','',new Date().toISOString()),/결과/);});
