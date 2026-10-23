import {runCliDemo} from '../runtime/cli-demo.mjs';
import {homedir} from 'node:os';
import {join} from 'node:path';
const root=join(homedir(),'BB_Office_Demo_CLI');
try{const job=await runCliDemo(root,{retry:process.argv.includes('--retry')});console.log('Status: '+job.status);console.log('BB Office > 작업 폴더 > jobs 폴더 연결: '+join(root,'jobs'));console.log('Final approval remains with you. No company inputs or schedules are connected.');}catch(error){console.error(error.message);process.exitCode=1;}
