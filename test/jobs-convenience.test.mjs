import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runCliDemo} from '../runtime/cli-demo.mjs';
import {writeDecision} from '../public/jobs-source.js';
import {restoreFolder,createFolderStore} from '../public/remembered-folder.js';

async function fixture(t){
 const root=await mkdtemp(join(tmpdir(),'bb-decision-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const job=await runCliDemo(root,{call:async p=>p==='codex'?{totalCents:4000,summary:'verified'}:{totalCents:4000,verdict:'pass',note:'independent'}});
 return {job,snapshot:await readFile(join(root,'jobs',job.id,'job.json'),'utf8')};
}
function disk(snapshot){let content=snapshot,writes=0;return {get content(){return content;},get writes(){return writes;},entry:{snapshot,handle:{getFileHandle:async()=>({getFile:async()=>({text:async()=>content}),createWritable:async()=>({write:async s=>{content=s;writes++;},close:async()=>{},abort:async()=>{}})})}}};}
test('browser approval finalizes actual CLI fixture without calling an executor',async t=>{
 const {snapshot}=await fixture(t),d=disk(snapshot);const saved=await writeDecision(d.entry,'approve','검토 완료');
 assert.equal(saved.status,'approved');assert.equal(JSON.parse(d.content).status,'approved');assert.equal(saved.decision.resultVersion,saved.resultVersion);assert.equal(d.writes,1);
 await assert.rejects(writeDecision({handle:d.entry.handle,snapshot:d.content},'approve','again'));
});
test('browser revision persists revising and retains model results',async t=>{const {job,snapshot}=await fixture(t),d=disk(snapshot);const result=await writeDecision(d.entry,'revise','표현 수정');assert.equal(result.status,'revising');assert.deepEqual(result.result,job.result);});
test('changed input, result or wrong source cannot be finalized',async t=>{
 const {job}=await fixture(t);
 for(const mutate of [j=>j.input.lines[0].quantity++,j=>j.result.totalCents++,j=>j.source='company-job',j=>j.ruleVersion='unknown',j=>j.review.verdict='fail']){
  const changed=structuredClone(job);mutate(changed);const d=disk(JSON.stringify(changed));await assert.rejects(writeDecision(d.entry,'approve',''));assert.equal(d.writes,0);
 }
});
test('saved granted directory restores without requesting permission',async()=>{let requests=0;const handle={kind:'directory',queryPermission:async()=> 'granted',requestPermission:async()=>{requests++;}};assert.deepEqual(await restoreFolder({get:async()=>handle}),{handle,granted:true});assert.equal(requests,0);});
test('prompt and revoked permissions preserve remembered folder for a user click',async()=>{for(const permission of ['prompt','denied']){const handle={kind:'directory',queryPermission:async()=>permission,requestPermission:async()=>{throw Error('must not prompt in background');}};assert.deepEqual(await restoreFolder({get:async()=>handle}),{handle,granted:false});}});
test('no saved directory, invalid handle and unavailable storage are explicit',async()=>{assert.deepEqual(await restoreFolder({get:async()=>null}),{handle:null,granted:false});await assert.rejects(restoreFolder({get:async()=>({kind:'file'})}),/유효/);await assert.rejects(createFolderStore(null).get(),/기억/);});
