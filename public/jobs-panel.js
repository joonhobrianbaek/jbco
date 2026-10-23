import {readJobs,jobStates,writeDecision} from './jobs-source.js';
const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
const open=el('button','작업 폴더');document.querySelector('.header-actions').append(open);
const dialog=document.createElement('dialog');dialog.id='jobs-dialog';
const title=el('h2','로컬 작업 폴더'),notice=el('p','jobs 폴더를 선택하세요. 파일은 외부로 전송하지 않으며 연결 중 30초마다 읽습니다. 승인은 decision만 기록합니다. 실행기가 이후 상태를 반영해야 합니다.'),connect=el('button','jobs 폴더 연결'),refresh=el('button','새로고침'),disconnect=el('button','연결 해제'),close=el('button','닫기'),status=el('p','연결 안 됨'),list=el('div','');status.setAttribute('role','status');dialog.append(title,notice,connect,refresh,disconnect,close,status,list);document.body.append(dialog);
const legend=el('div','배지가 있는 직원만 실제 파일 업무 상태입니다. 나머지 동작은 연출입니다.');legend.className='jobs-legend';notice.after(legend);
let directory=null,entries=[],generation=0,busy=false;
open.onclick=()=>dialog.showModal();window.addEventListener('office-jobs-open',()=>{if(!dialog.open)dialog.showModal();});close.onclick=()=>dialog.close();
function publish(jobs){jobs=[...jobs,...(window.officeSyntheticJobs||[])];window.officeLocalJobs=jobs;window.dispatchEvent(new CustomEvent('office-local-jobs',{detail:jobs}));window.dispatchEvent(new CustomEvent('office-jobs-updated',{detail:jobStates(jobs)}));}
function render(){list.replaceChildren();for(const entry of entries){const job=entry.job,stale=job.source&&entries.some(other=>other.job.source===job.source&&other.job.id!==job.id&&other.job.createdAt>=job.createdAt),card=el('article','');card.append(el('h3',job.title),el('p',job.status+(job.decision.action?' · 결정: '+job.decision.action:'')));if(stale)card.append(el('p','이전 입력 또는 규칙 버전입니다. 최신 결과로 사용하지 마세요.'));if(job.lastCheckedAt)card.append(el('p','실행 점검: '+job.lastCheckedAt+' · 마지막 성공: '+(job.lastSuccessAt||'없음')));if(['working','validating'].includes(job.status)&&Date.now()-Date.parse(job.lastCheckedAt)>300000)card.append(el('p','5분 이상 실행 갱신 없음. 중단 여부를 확인해주세요.'));if(job.errorSummary)card.append(el('p',job.errorSummary));for(const s of jobStates([job]))card.append(el('p',s.seat+' · '+s.state));if(!stale&&job.status==='awaiting_approval'&&job.decision.action===null){const note=el('textarea','');note.maxLength=4000;note.setAttribute('aria-label','대표 결정 사유');card.append(note);for(const [action,label]of [['approve','승인 기록'],['revise','수정 요청']]){const button=el('button',label);button.onclick=async()=>{button.disabled=true;const selectedDirectory=directory,version=generation;try{if(await selectedDirectory.requestPermission({mode:'readwrite'})!=='granted')throw Error('결정 기록에는 폴더 쓰기 권한이 필요합니다.');if(version!==generation)throw Error('연결이 변경되었습니다.');await writeDecision(entry,action,note.value);await load();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}};card.append(button);}}list.append(card);}}
async function load(){if(!directory||busy)return;busy=true;const current=directory,version=generation;try{const result=await readJobs(current);if(version!==generation)return;entries=result.entries;render();publish(entries.map(e=>e.job));status.textContent='마지막 점검: '+new Date().toLocaleString()+' · '+entries.length+'건'+(result.errors.length?' · 읽기 오류: '+result.errors.map(e=>e.name+' ('+e.message+')').join(', '):'');}catch(error){if(version===generation){entries=[];render();publish([]);status.textContent='읽기 실패: '+error.message;}}finally{busy=false;}}
connect.onclick=async()=>{try{if(!window.showDirectoryPicker)throw Error('폴더 연결은 지원되는 Chrome 또는 Edge의 보안 연결에서 사용해주세요.');const selected=await window.showDirectoryPicker({mode:'read'});directory=selected;generation++;await load();}catch(error){status.textContent=error.name==='AbortError'?'폴더 선택을 취소했습니다.':error.message;}};
refresh.onclick=load;disconnect.onclick=()=>{generation++;directory=null;entries=[];render();publish([]);status.textContent='연결 해제됨';};
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
