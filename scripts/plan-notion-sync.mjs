import {readFile, writeFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {planNotionSync} from '../runtime/notion-sync.mjs';
const [root, snapshotPath, bindingsPath, outputPath] = process.argv.slice(2);
if (!root || !snapshotPath || !bindingsPath || !outputPath) throw new Error('사용법: node scripts/plan-notion-sync.mjs <private-root> <rows.json> <bindings.json> <plan.json>');
const jobs = [];
for (const id of await readdir(resolve(root,'jobs'))) {
 if (/^[a-f0-9]{64}$/.test(id)) jobs.push(JSON.parse(await readFile(resolve(root,'jobs',id,'job.json'),'utf8')));
}
const rows = JSON.parse(await readFile(snapshotPath,'utf8'));
const bindings = JSON.parse(await readFile(bindingsPath,'utf8'));
const plan = planNotionSync(jobs,rows,bindings);
await writeFile(outputPath, JSON.stringify(plan,null,2)+'\n',{mode:0o600,flag:'wx'});
console.log(`동기화 계획 ${plan.length}건 저장. 네트워크 쓰기·승인·일정 실행 없음.`);
