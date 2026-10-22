import {createLocalJobs} from '../runtime/local-jobs.mjs';
const root=process.argv[2];
if(!root)throw Error('사용법: node scripts/demo-local-jobs.mjs /private/path');
const runtime=await createLocalJobs(root);
for(const [source,input]of [
 ['demo-complete',{lines:[{item:'가상 품목 A',quantity:2,unitCents:1250},{item:'가상 품목 B',quantity:3,unitCents:500}],expectedTotalCents:4000}],
 ['demo-missing',{lines:[{item:'가상 누락 단가',quantity:2}]}],
 ['demo-mismatch',{lines:[{item:'가상 불일치',quantity:1,unitCents:100}],expectedTotalCents:200}]
]){const registered=await runtime.register(source,input);await runtime.applyDecision(registered.id);const job=await runtime.run(registered.id);console.log(`${source}: ${job.status} (${job.id})`);}
console.log('jobs 폴더를 오피스에 연결하세요: '+root+'/jobs');
