import {meetingCases} from './meeting-demo-core.js';
import {createFolderStore,restoreFolder} from './remembered-folder.js';
import {enqueueMeeting} from './meeting-queue.js';
const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
const dialog=node('dialog','');dialog.id='meeting-workbench';
const title=node('h2','회의 메모 → 할 일 정리'),intro=node('p','회사 자료가 아닌 고정 가상 예시로 업무 접수와 AI 정리를 확인합니다. 실제 캘린더·메시지 전송은 없습니다.'),select=node('select',''),preview=node('div',''),feedback=node('p',''),queue=node('button','가상 업무 접수'),folder=node('button','작업 폴더 열기'),close=node('button','닫기');
select.setAttribute('aria-label','가상 회의 예시');feedback.setAttribute('role','status');
for(const [id,c]of Object.entries(meetingCases)){const option=node('option',c.title);option.value=id;select.append(option);}
function show(){preview.replaceChildren();for(const n of meetingCases[select.value].notes)preview.append(node('p',n.id+' · '+n.text));}
select.onchange=show;show();
const steps=node('ol','');for(const text of ['예시 선택 → 가상 업무 접수. 아직 AI는 실행되지 않습니다.','PC 실행기를 받아 압축 해제 → RUN_MEETING_DEMO.cmd 실행. Codex 정리와 Claude 검토가 시작됩니다.','작업 폴더에서 결과와 원문을 확인 → 승인 또는 수정 요청.'])steps.append(node('li',text));
const download=node('a','회의 업무용 PC 실행기 ZIP 받기');download.href='./downloads/BB_Office_PC_Meeting.zip';download.download='BB_Office_PC_Meeting.zip';download.className='meeting-download';
queue.onclick=async()=>{queue.disabled=true;try{const saved=await restoreFolder(createFolderStore());if(!saved.handle)throw Error('먼저 작업 폴더에서 jobs 폴더를 연결해주세요.');if(await saved.handle.queryPermission({mode:'readwrite'})!=='granted'&&await saved.handle.requestPermission({mode:'readwrite'})!=='granted')throw Error('접수 파일을 저장하려면 jobs 폴더 쓰기 권한이 필요합니다.');const result=await enqueueMeeting(saved.handle,select.value);feedback.textContent=result.reused?'같은 예시가 이미 접수됐습니다. 기존 결과를 유지했습니다.':'접수 완료 · 아직 AI 실행 전입니다. PC에서 RUN_MEETING_DEMO.cmd를 실행해주세요.';window.dispatchEvent(new Event('office-local-refresh'));}catch(error){feedback.textContent=error.message;}finally{queue.disabled=false;}};
folder.onclick=()=>{dialog.close();window.dispatchEvent(new Event('office-jobs-open'));};close.onclick=()=>dialog.close();
dialog.append(title,intro,select,preview,steps,download,queue,folder,close,feedback);document.body.append(dialog);
const open=node('button','회의 메모 정리');open.onclick=()=>dialog.showModal();document.querySelector('.header-actions').append(open);
