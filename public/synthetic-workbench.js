import {executeSynthetic,decideSynthetic} from './synthetic-engine.js';
import {jobStates,validateJob} from './jobs-source.js?v=2';
const stateNames={received:'접수',awaiting_approval:'대표 승인 대기',waiting_input:'자료 대기',failed:'실패',approved:'대표 승인 완료',revising:'수정 요청'},verificationNames={passed:'통과',failed:'실패',unrun:'미검증'};
const key='bb-office-synthetic-v1',node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
const dialog=node('dialog','');dialog.id='synthetic-workbench';dialog.className='synthetic-workbench';
const title=node('h2','가상 업무 실행실'),description=node('p','가상 입력 → 코드 실행 → 독립 검증 → 대표 결정. GPT·Claude 자동 실행과 Notion 자동 동기화는 아직 미연결입니다.'),status=node('p',''),list=node('div','');status.setAttribute('role','status');
let jobs=[];try{const data=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(data))jobs=data.filter(j=>j?.executor==='browser-code').map(validateJob).slice(-20);}catch{status.textContent='저장 기록을 읽지 못했습니다. 새 실행으로 확인하세요.';}
function publish(){window.officeSyntheticJobs=jobs;const external=(window.officeLocalJobs||[]).filter(j=>j.executor!=='browser-code');const combined=[...external,...jobs];window.officeLocalJobs=combined;window.dispatchEvent(new CustomEvent('office-local-jobs',{detail:combined}));window.dispatchEvent(new CustomEvent('office-jobs-updated',{detail:jobStates(combined)}));}
function persist(){try{localStorage.setItem(key,JSON.stringify(jobs));}catch{status.textContent='이 브라우저에 저장하지 못했습니다. 보고서를 내려받으세요.';}publish();}
function render(){list.replaceChildren();for(const job of [...jobs].reverse()){
 const card=node('article','');card.append(node('h3',job.title),node('p',`${stateNames[job.status]||job.status} · 검증 ${verificationNames[job.validationStatus]||job.validationStatus} · AI 호출 없음`));
 if(job.result)card.append(node('p',`계산 합계 $${(job.result.totalCents/100).toFixed(2)} / 대조 합계 $${(job.input.expectedTotalCents/100).toFixed(2)}`));
 if(job.errorSummary)card.append(node('p',job.errorSummary));
 const details=node('details',''),summary=node('summary','실행 근거·입력 버전'),pre=node('pre',JSON.stringify(job,null,2));details.append(summary,pre);card.append(details);
 const download=node('button','실행 보고서 JSON');download.type='button';download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(job,null,2)],{type:'application/json'}));const a=node('a','');a.href=url;a.download='BB_SYNTHETIC_'+job.id.slice(0,12)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};card.append(download);
 if(job.status==='awaiting_approval'){
  const note=node('textarea','');note.placeholder='대표 결정 사유';note.maxLength=4000;note.setAttribute('aria-label','가상 업무 대표 결정 사유');card.append(note);
  for(const [action,label]of [['approve','가상 결과 승인'],['revise','수정 요청']]){const b=node('button',label);b.onclick=async()=>{b.disabled=true;try{const updated=await decideSynthetic(job,action,note.value);jobs=jobs.map(j=>j.id===job.id?updated:j);persist();render();}catch(e){status.textContent=e.message;b.disabled=false;}};card.append(b);}
 }list.append(card);
}}
dialog.append(title,description);
for(const [name,label]of [['normal','정상 업무 실행'],['missing','자료 누락 검증'],['mismatch','합계 불일치 검증']]){
 const b=node('button',label);b.onclick=async()=>{b.disabled=true;try{const job=await executeSynthetic(name);if(jobs.some(j=>j.id===job.id)){status.textContent='같은 입력·규칙의 업무가 이미 있습니다. 기존 결과를 유지했습니다.';}else{jobs.push(job);persist();render();status.textContent='가상 코드 실행 완료. 실제 회사 자료·외부 실행 없음.';}}catch(e){status.textContent=e.message;}finally{b.disabled=false;}};dialog.append(b);
}
const close=node('button','닫기');close.onclick=()=>dialog.close();dialog.append(close,status,list);document.body.append(dialog);
const open=node('button','가상 업무 실행');open.type='button';document.querySelector('.header-actions').append(open);open.onclick=()=>{render();dialog.showModal();};
window.addEventListener('office-jobs-open',event=>{if(jobs.some(j=>j.id===event.detail?.jobId)){document.querySelector('#jobs-dialog')?.close();render();if(!dialog.open)dialog.showModal();}});
render();publish();
