import {meetingRequest,validateMeetingRequest,createMeetingJob} from './meeting-demo-core.js';
async function optionalJson(directory,name){try{const f=await directory.getFileHandle(name);const text=await (await f.getFile()).text();if(text.length>1024*1024)throw Error('업무 파일 크기 초과');return JSON.parse(text);}catch(error){if(error.name==='NotFoundError')return null;throw error;}}
async function writeJson(directory,name,value){const file=await directory.getFileHandle(name,{create:true}),writer=await file.createWritable();try{await writer.write(JSON.stringify(value,null,2)+'\n');await writer.close();}catch(error){await writer.abort().catch(()=>{});throw error;}}
/** Queue a fixed fictional request in the selected jobs folder. Never invokes a model. */
export async function enqueueMeeting(directory,caseId){
 if(directory.name!=='jobs')throw Error('jobs 폴더를 연결해주세요. 긴 이름의 개별 업무 폴더는 선택하지 마세요.');
 const request=meetingRequest(caseId),folder=await directory.getDirectoryHandle(request.id,{create:true}),existingRequest=await optionalJson(folder,'request.json'),existing=await optionalJson(folder,'job.json');
 if(existingRequest)validateMeetingRequest(existingRequest);
 if(existingRequest&&existingRequest.id!==request.id)throw Error('기존 요청 ID가 다릅니다. 덮어쓰지 않았습니다.');
 if(existing&&(existing.id!==request.id||existing.caseId!==caseId||existing.source!=='local-meeting-demo-'+caseId))throw Error('기존 업무가 다릅니다. 덮어쓰지 않았습니다.');
 if(existingRequest){if(!existing)throw Error('접수 기록이 불완전합니다. 실행기와 기존 파일을 확인해주세요.');return {job:existing,reused:true};}
 const job=existing||createMeetingJob(request);
 // request.json is the ready marker: write the initial job before exposing the request.
 if(!existing)await writeJson(folder,'job.json',job);
 await writeJson(folder,'request.json',request);
 return {job,reused:Boolean(existing)};
}
