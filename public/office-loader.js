// Hybrid 3D uses the same approved sprite art; the 2D option loads no WebGL.
const mode=new URLSearchParams(location.search).get('view')==='light'?'light':'hybrid';
document.body.dataset.renderMode=mode;
const toggle=document.createElement('button');toggle.id='render-mode';toggle.textContent=mode==='light'?'3D 오피스':'2D 절전 화면';toggle.title=mode==='light'?'선택하면 3D 모델을 불러옵니다.':'3D를 종료하고 가벼운 화면으로 전환합니다.';toggle.onclick=()=>{const url=new URL(location.href);if(mode==='light')url.searchParams.delete('view');else url.searchParams.set('view','light');location.assign(url);};document.querySelector('.header-actions').prepend(toggle);
if(mode==='hybrid'){try{await import('./office-hybrid.js?v=3');}catch(error){console.error('Lightweight 3D office unavailable:',error);document.querySelector('#loading').hidden=true;document.querySelector('#error').hidden=false;document.querySelector('#error h2').textContent='3D 오피스를 열 수 없어요.';document.querySelector('#error p').textContent='오른쪽 위의 2D 절전 화면으로 전환해 업무를 계속할 수 있어요.';}}
else{
 const {employees}=await import('./employees.js?v=1');
 const {attachOfficeReports}=await import('./office-reports.js?v=2');
 const root=document.querySelector('#office');root.setAttribute('aria-label','가벼운 2D 오피스 · 직원과 부서를 눌러 업무 열기');
 const floor=document.createElement('div');floor.className='light-office';
 const node=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 const emit=(type,detail)=>window.dispatchEvent(new CustomEvent(type,{detail}));
 function sprite(provider){const index={owner:0,gpt:1,claude:2,muse:3,gemini:4,copilot:5}[provider]??1;const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.classList.add('crew-sprite');svg.setAttribute('viewBox',`${index%3*512} ${index<3?0:540} 512 ${index<3?536:484}`);svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const image=document.createElementNS(ns,'image');image.setAttribute('href','./assets/crew/office-crew.png');image.setAttribute('width','1536');image.setAttribute('height','1024');svg.append(image);return svg;}
 function zone(name,cls){const el=node('section','',cls+' light-zone');el.append(node('h2',name));floor.append(el);return el;}
 const common=zone('TEAM STUDIO','light-studio');
 const deskFor=e=>{const desk=node('button','','light-desk');desk.dataset.employee=e.id;desk.setAttribute('aria-label',e.provider.toUpperCase()+' · '+e.role+' 업무 열기');desk.append(sprite(e.provider),node('span','','mini-desk'),node('span',e.role,'light-role'),node('span','업무 열기 ↗','light-desk-link'));desk.onclick=()=>emit('office-assign',e.id);return desk;};
 for(const [id,name]of [['gpt','GPT 부서'],['claude','Claude 부서'],['gemini','Gemini 팀'],['copilot','Copilot 팀']]){const team=node('div','','light-team');team.dataset.provider=id;const heading=node('button',name,'light-team-name');heading.onclick=()=>emit('office-team-open',id);team.append(heading);for(const e of employees.filter(e=>e.provider===id&&!e.lounge))team.append(deskFor(e));common.append(team);}
 const owner=zone('대표실','light-owner');const boss=node('button','','owner-character');boss.append(sprite('owner'));boss.setAttribute('aria-label','대표 대시보드 열기');boss.onclick=()=>emit('office-dashboard-open');owner.append(boss);const command=node('button','업무 지시 · 대표 승인','light-command');command.onclick=()=>emit('office-autonomy-open');owner.append(command);
 const chief=zone('Muse · 비서실','light-chief');const chiefButton=node('button','','chief-character');chiefButton.dataset.employee='muse-video';chiefButton.setAttribute('aria-label','Muse 비서실장 만나기');chiefButton.append(sprite('muse'),node('span','비서실장 만나기','light-role'));chiefButton.onclick=()=>emit('office-team-open','muse');chief.append(chiefButton);
 const meeting=zone('협업 회의실','light-meeting');meeting.append(node('div','GPT × CLAUDE','light-table'));const meet=node('button','공동 업무 열기','light-secondary');meet.onclick=()=>emit('office-meeting-open');meeting.append(meet);
 const lounge=zone('라운지','light-lounge');const sofa=node('div','','light-sofa');for(const e of employees.filter(e=>e.lounge)){const seat=deskFor(e);seat.classList.add('lounge-seat');sofa.append(seat);}lounge.append(sofa,node('div','','light-coffee'));
 floor.append(node('span','BB OFFICE / EVERYDAY STUDIO','light-floor-sign'));root.append(floor);
 const reports=attachOfficeReports({floor,sprite});
 document.querySelector('#loading').classList.add('ready');document.querySelector('#loading').hidden=true;
 const meta=document.querySelector('.footer-meta span:last-child');if(meta)meta.textContent='가벼운 2D 오피스 · 직원 보고는 대기목록에서 확인';
 document.querySelector('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();};
 window.officeView={getState:()=>({webgl:false,renderMode:'light',staffCount:employees.length,reports:reports.state(),locations:employees.map(e=>({id:e.id,location:reports.state().employeeId===e.id?'보고 중':e.provider==='muse'?'비서실':e.lounge?'라운지':'업무석'}))})};
}
