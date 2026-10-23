import {homedir} from 'node:os';
import {join} from 'node:path';
import {runMeetingQueue} from '../runtime/meeting-demo.mjs';
try{const jobs=await runMeetingQueue(join(homedir(),'BB_Office_Demo_CLI'),{retry:process.argv.includes('--retry'),onProgress:message=>console.log(message)});console.log(jobs.length?jobs.map(j=>j.title+': '+j.status).join('\n'):'No meeting requests. Queue a fictional meeting in BB Office first.');console.log('No company data, schedules or external actions connected.');}catch(error){console.error(error.message);process.exitCode=1;}
