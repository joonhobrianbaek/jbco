import {readJobs,jobStates,writeDecision} from './jobs-source.js?v=3';
import {createFolderStore,restoreFolder} from './remembered-folder.js';
const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
const open=el('button','작업 폴더');document.querySelector('.header-actions').append(open);
const dialog=document.createElement('dialog');dialog.id='jobs-dialog';
const title=el('h2','로컬 작업 폴더'),notice=el('p','처음 선택한 jobs 폴더를 이 브라우저에 기억합니다. 연결 중에는 30초마다 자동 갱신하며 파일을 외부로 보내지 않습니다.'),connect=el('button','jobs 폴더 연결'),change=el('button','다른 폴더 선택'),refresh=el('button','새로고침'),disconnect=el('button','연결 해제'),close=el('button','닫기'),status=el('p','저장된 폴더 확인 중…'),list=el('div','');
status.setAttribute('role','status');const actions=el('div','');actions.className='jobs-actions';actions.append(connect,change,refresh,disconnect,close);dialog.append(title,notice,actions,status,list);document.body.append(dialog);
const legend=el('div','배지가 있는 직원만 파일 업무 상태입니다. 가상 CLI 업무는 승인 즉시 반영되며 실행기를 다시 켤 필요가 없습니다.');legend.className='jobs-legend';notice.after(legend);
let directory=null,entries=[],generation=0,busy=false,canRead=false,persistenceWarning='',changing=false;
const store=createFolderStore();let storageQueue=Promise.resolve();
const persist=operation=>{const next=storageQueue.then(operation);storageQueue=next.catch(()=>{});return next;};
function controls(){connect.textContent=canRead?'연결됨 · '+directory.name:directory?'저장된 폴더 다시 연결':'jobs 폴더 연결';connect.disabled=canRead||changing;change.hidden=!directory;change.disabled=changing;refresh.disabled=!canRead;disconnect.disabled=!directory||changing;open.textContent='작업 폴더'+(canRead?' · '+entries.length:directory?' · 재연결':'' );}
open.onclick=()=>dialog.showModal();window.addEventListener('office-jobs-open',()=>{if(!dialog.open)dialog.showModal();});close.onclick=()=>dialog.close();
function publish(jobs){jobs=[...jobs,...(window.officeSyntheticJobs||[])];window.officeLocalJobs=jobs;window.dispatchEvent(new CustomEvent('office-local-jobs',{detail:jobs}));window.dispatchEvent(new CustomEvent('office-jobs-updated',{detail:jobStates(jobs)}));}
const statusNames={received:'접수',planned:'계획 중',drafted:'초안 완료',reviewed:'검토 완료',awaiting_approval:'대표 승인 대기',revising:'수정 요청됨',approved:'승인 완료',failed:'실패',waiting_input:'자료 대기',retry_pending:'재시도 대기',validating:'검증 중'};
function render(){list.replaceChildren();for(const entry of entries){
 const job=entry.job,stale=job.source&&entries.some(other=>other.job.source===job.source&&other.job.id!==job.id&&other.job.createdAt>=job.createdAt),card=el('article','');
 card.append(el('h3',job.title),el('p',(statusNames[job.status]||job.status)+(job.decision.action?' · 결정: '+(job.decision.action==='approve'?'승인':'수정 요청'):'')));
 if(stale)card.append(el('p','이전 입력 또는 규칙 버전입니다. 최신 결과로 사용하지 마세요.'));
 if(job.lastCheckedAt)card.append(el('p','마지막 확인: '+new Date(job.lastCheckedAt).toLocaleString()+' · 마지막 검증 성공: '+(job.lastSuccessAt?new Date(job.lastSuccessAt).toLocaleString():'없음')));
 if(job.result&&Number.isSafeInteger(job.result.totalCents))card.append(el('p','결과 합계: $'+(job.result.totalCents/100).toFixed(2)+' · 검증: '+(job.validationStatus==='passed'?'통과':job.validationStatus||'미확인')));
 if(job.executor==='local-cli'&&job.result?.review)card.append(el('p','Claude 검토: '+(job.result.review.verdict==='pass'?'통과':'실패')));
 if(job.executor==='local-cli'&&job.result){const details=el('details',''),summary=el('summary','분석·검토 내용 보기');details.append(summary,el('p',job.result.draft?.summary||'분석 요약 없음'),el('p',job.result.review?.note||'검토 메모 없음'));card.append(details);}
 if(['validating','received','planned','drafted'].includes(job.status)&&Date.now()-Date.parse(job.lastCheckedAt)>300000)card.append(el('p','5분 이상 실행 갱신이 없습니다. 실행기 상태를 확인해주세요.'));
 if(job.errorSummary)card.append(el('p',job.errorSummary));
 for(const s of jobStates([job]))if(s.state!=='approval')card.append(el('p',(({'gpt-analysis':'Codex 분석','claude-review':'Claude 검토'})[s.seat]||s.seat)+' · '+(s.state==='done'?'완료':s.state)));
 if(!stale&&job.status==='awaiting_approval'&&job.decision.action===null){
  const note=el('textarea','');note.maxLength=4000;note.placeholder='승인 메모 또는 수정 요청 사유';note.setAttribute('aria-label','대표 결정 사유');card.append(note);
  for(const [action,label]of [['approve',job.executor==='local-cli'?'승인 완료':'승인 기록'],['revise','수정 요청']]){
   const button=el('button',label);button.onclick=async()=>{const buttons=[...card.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);const selected=directory,version=generation;
    try{if(await selected.requestPermission({mode:'readwrite'})!=='granted')throw Error('결정 기록에는 폴더 쓰기 권한이 필요합니다.');if(version!==generation)throw Error('연결이 변경되었습니다.');const updated=await writeDecision(entry,action,note.value);generation++;entry.job=updated;render();publish(entries.map(e=>e.job));status.textContent=action==='approve'?'승인 완료 · 실행기를 다시 켤 필요가 없습니다.':'수정 요청을 저장했습니다.';await load();}
    catch(error){status.textContent=error.message;}finally{buttons.forEach(b=>b.disabled=false);}};card.append(button);
  }
 }
 list.append(card);
}}
async function load(){
 if(!directory||!canRead||busy)return;busy=true;const current=directory,version=generation;
 try{const result=await readJobs(current);if(version!==generation)return;entries=result.entries;render();publish(entries.map(e=>e.job));status.textContent='연결됨 · '+current.name+' · '+entries.length+'건 · 자동 갱신: '+new Date().toLocaleTimeString()+(result.errors.length?' · 읽기 오류: '+result.errors.map(e=>e.name+' ('+e.message+')').join(', '):'')+persistenceWarning;}
 catch(error){if(version===generation){entries=[];render();publish([]);if(['NotAllowedError','SecurityError'].includes(error.name)){canRead=false;status.textContent='폴더 권한을 다시 확인해주세요. 저장된 폴더 다시 연결을 누르면 됩니다.';}else status.textContent='읽기 실패: '+error.message;}}
 finally{busy=false;controls();if(version!==generation&&canRead)void load();}
}
async function choose(){if(!window.showDirectoryPicker)throw Error('폴더 연결은 Chrome 또는 Edge의 보안 연결에서 사용해주세요.');return window.showDirectoryPicker({mode:'read',id:'bb-office-jobs',...(directory?{startIn:directory}:{})});}
async function connectFolder(replace=false){
 changing=true;controls();try{
  const selected=replace||!directory?await choose():directory;
  if(await selected.queryPermission({mode:'read'})!=='granted'&&await selected.requestPermission({mode:'read'})!=='granted')throw Error('폴더 읽기 권한을 허용해주세요.');
  generation++;directory=selected;canRead=true;entries=[];persistenceWarning='';
  try{await persist(()=>store.set(selected));}catch{persistenceWarning=' · 폴더 기억 실패: 다음 접속 때 다시 선택해야 합니다.';}
  await load();
 }catch(error){status.textContent=error.name==='AbortError'?'폴더 선택을 취소했습니다.':error.message;}finally{changing=false;controls();}
}
connect.onclick=()=>connectFolder();change.onclick=()=>connectFolder(true);refresh.onclick=load;
disconnect.onclick=async()=>{generation++;directory=null;canRead=false;entries=[];render();publish([]);controls();try{await persist(()=>store.clear());status.textContent='연결 해제됨 · 저장된 폴더도 지웠습니다.';}catch{status.textContent='연결 해제됨 · 폴더 기억 삭제 실패. 브라우저 사이트 데이터를 확인해주세요.';}};
changing=true;controls();
(async()=>{try{const saved=await restoreFolder(store);directory=saved.handle;canRead=saved.granted;if(canRead)await load();else status.textContent=directory?'기억한 폴더: '+directory.name+' · 저장된 폴더 다시 연결을 눌러 권한만 확인해주세요.':'처음 한 번 jobs 폴더를 선택해주세요.';}catch(error){status.textContent='폴더 복원 실패: '+error.message;}finally{changing=false;controls();}})();
setInterval(()=>{if(!document.hidden)void load();},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load();});
const badges=new Map();const labels={working:'작업 중',done:'완료',question:'자료 필요',error:'오류',approval:'승인 대기'};
window.addEventListener('office-jobs-updated',event=>{
 for(const n of badges.values())n.remove();badges.clear();
 const grouped=new Map(),priority={error:0,approval:1,question:2,working:3,done:4};
 for(const state of event.detail){if(!labels[state.state])continue;if(!grouped.has(state.seat))grouped.set(state.seat,[]);grouped.get(state.seat).push(state);}
 for(const [seat,states]of grouped){
  states.sort((a,b)=>priority[a.state]-priority[b.state]);
  const primary=states[0],badge=el('span',labels[primary.state]+(states.length>1?' +'+(states.length-1):''));
  badge.className='job-badge';badge.dataset.seat=seat;badge.dataset.state=primary.state;
  badge.title=states.map(s=>labels[s.state]+' · '+s.title).join('\n');badge.setAttribute('aria-label',badge.title);badge.tabIndex=0;
  document.body.append(badge);badges.set(seat,badge);
 }place();
});
function place(){for(const [seat,badge]of badges){const light=[...document.querySelectorAll('[data-employee]')].find(e=>e.dataset.employee===seat);const rect=light?.getBoundingClientRect();const point=rect?{x:rect.left+rect.width/2,y:rect.top}:window.officeView?.deskPoint?.(seat);badge.hidden=!point;if(point){badge.style.left=point.x+'px';badge.style.top=point.y+'px';}}}
setInterval(()=>{if(badges.size&&!document.hidden)place();},100);
