import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {roamingStaff,ambientRoute} from './ambient-routes.js?v=1';
import {furnishOffice} from './office-furnishings.js?v=2';
import {executiveOffice,buildReportRoute} from './report-routes.js?v=2';
import {createGameCrew} from './game-crew.js?v=2';
import {employees} from './employees.js?v=2';
import {attachOfficeReports} from './office-reports.js?v=3';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const root=document.querySelector('#office');root.setAttribute('aria-label','절전형 3D 오피스 · 작은 3D 직원과 보고 대기목록');
const renderer=new T.WebGLRenderer({antialias:false,powerPreference:'low-power',alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1));renderer.shadowMap.enabled=false;renderer.setClearColor('#17201f');renderer.outputColorSpace=T.SRGBColorSpace;root.append(renderer.domElement);
const scene=new T.Scene();const camera=new T.OrthographicCamera(-15,15,10,-10,.1,100);camera.position.set(19,17,24);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.autoRotate=false;controls.target.set(0,.8,0);controls.minPolarAngle=.3;controls.maxPolarAngle=1.35;controls.minZoom=.55;controls.maxZoom=4;
scene.add(new T.HemisphereLight('#fff7e4','#667e6b',2.3));const sun=new T.DirectionalLight('#fff6d7',2.1);sun.position.set(-5,12,8);scene.add(sun);
const grain=document.createElement('canvas');grain.width=512;grain.height=128;const gc=grain.getContext('2d');gc.fillStyle='#c6a576';gc.fillRect(0,0,512,128);for(let i=0;i<260;i++){gc.strokeStyle=i%2?'#f6d6a320':'#714e2d18';gc.beginPath();const y=i*.49;gc.moveTo(0,y);gc.bezierCurveTo(170,y+Math.sin(i)*3,350,y-Math.cos(i)*3,512,y);gc.stroke();}const woodTexture=new T.CanvasTexture(grain);woodTexture.colorSpace=T.SRGBColorSpace;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),boxGeo=new T.BoxGeometry(1,1,1),materials=new Map(),pickables=[],actors=new Map(),billboards=[];
let frame=null,timer=null,lastFrame=0,frames=0,moving=null,paused=false,reports,focused='overview',ambient=null,ambientTimer=null,breakTimer=null,ambientTurn=0,workTimer=null,workUntil=0,workStarted=0;
function mat(color){if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial(['#c6a576','#b29361','#c5a779','#c1a77c'].includes(color)?{map:woodTexture}:{color}));return materials.get(color);}
function box(color,x,y,z,w,h,d,parent=scene){const mesh=new T.Mesh(boxGeo,mat(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;}
function softBox(color,x,y,z,w,h,d,r=.12){const shape=new T.Shape();shape.moveTo(-w/2+r,-d/2);shape.lineTo(w/2-r,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);shape.lineTo(w/2,d/2-r);shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);shape.lineTo(-w/2+r,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);shape.lineTo(-w/2,-d/2+r);shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const geometry=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:4,steps:1});geometry.translate(0,0,-h/2);geometry.rotateX(-Math.PI/2);const object=new T.Mesh(geometry,mat(color));object.position.set(x,y,z);scene.add(object);return object;}
const emit=(type,detail)=>window.dispatchEvent(new CustomEvent(type,{detail}));
function clickable(object,id){object.userData.action=id;pickables.push(object);return object;}
function label(text,x,y,z,width=2){const c=document.createElement('canvas');c.width=384;c.height=72;const ctx=c.getContext('2d');ctx.fillStyle='#e7eadc';ctx.fillRect(0,0,384,72);ctx.fillStyle='#335443';ctx.font='600 29px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,192,38);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const plane=new T.Mesh(new T.PlaneGeometry(width,width*72/384),new T.MeshBasicMaterial({map}));plane.position.set(x,y,z);scene.add(plane);billboards.push(plane);return plane;}
box('#425b45',0,-.25,0,21,.35,12.8);box('#e2dfd2',0,-.04,0,20.8,.12,12.6);
// Individual floorboards add wood detail without texture downloads or shadows.
for(let z=-6;z<6.2;z+=.75)box('#c7c5b8',0,.025,z,20.6,.012,.018);
box('#e2e4d9',-3.9,.045,-.8,11.2,.035,7.5);box('#c6d6c4',7,.05,-3.7,5.6,.04,4.9);box('#dfd4e2',7,.05,.1,5.6,.04,2.1);box('#c9d8d1',7,.05,3.9,5.6,.04,4);box('#e4dbc6',-3,.05,4.5,8.3,.04,2.7);
const potGeo=new T.CylinderGeometry(.29,.22,.48,12),leafGeo=new T.SphereGeometry(1,8,6);function plant(x,z){const pot=new T.Mesh(potGeo,mat('#dad8c4'));pot.position.set(x,.26,z);scene.add(pot);for(let i=0;i<5;i++){const leaf=new T.Mesh(leafGeo,mat(i%2?'#61875c':'#416c47'));leaf.position.set(x+Math.sin(i*1.7)*.22,.95+i*.05,z+Math.cos(i*1.7)*.22);leaf.scale.set(.12,.55,.045);leaf.rotation.set(.2,(i-1)*.7,(i-2)*.2);scene.add(leaf);}}
for(const [x,z]of [[-9.4,-5.4],[-9.4,5.4],[3.8,-5.4],[9.5,5.4]])plant(x,z);
function chair(x,z,color='#354c3c'){box(color,x,.56,z,.63,.12,.58);box(color,x,.95,z-.22,.63,.74,.09);box('#4e6052',x,.3,z,.07,.5,.07);box('#4e6052',x,.1,z,.72,.06,.56);}
function desk(x,z,w=2.6){softBox('#c6a576',x,.88,z,w,.12,1.12);for(const dx of [-w/2+.16,w/2-.16])box('#3c5143',x+dx,.46,z,.075,.82,.88);box('#253d32',x+.35,1.2,z+.04,.83,.51,.07);box('#546c58',x+.35,.99,z+.04,.06,.23,.07);box('#789883',x+.35,1.2,z+.085,.74,.42,.012);box('#efeee1',x-.7,.99,z+.2,.28,.04,.34);box('#927d55',x-.98,1.0,z-.08,.20,.035,.20);box('#927d55',x-.98,1.20,z-.08,.025,.39,.025);box('#dfd3ad',x-.98,1.40,z-.08,.30,.14,.24);box('#445b50',x-.15,.99,z-.27,.60,.035,.22);for(let row=0;row<3;row++)box('#b8c6b4',x-.15,1.01,z-.34+row*.065,.49,.008,.018);chair(x-.15,z-.75);}
for(const e of employees.filter(e=>e.desk&&e.provider!=='muse'))desk(e.desk[0],e.desk[1]);
desk(...executiveOffice.desk,3.1);desk(7,-.05,2.5);
// Pantry and freestanding art; no opaque outer wall blocks orbiting.
box('#b29361',-2.1,.55,-5.55,8.9,1.05,.7);box('#ebe9da',-2.1,1.1,-5.55,9.1,.12,.87);box('#263b30',-4.8,1.35,-5.55,.6,.45,.5);
for(const x of [-4,-2,0,2])box('#bfcaaf',x,1.28,-5.6,.16,.25,.16);
const artLoader=new T.TextureLoader();for(const [i,file]of ['mona-lisa.jpg','basquiat-self-portrait.jpg'].entries()){const x=-8.1+i*1.65;box('#b29a68',x,1.7,-5.55,1.18,1.6,.09);const map=artLoader.load('./assets/'+file,invalidate);map.colorSpace=T.SRGBColorSpace;const art=new T.Mesh(new T.PlaneGeometry(1.02,1.42),new T.MeshBasicMaterial({map}));art.position.set(x,1.7,-5.49);scene.add(art);if(i===0)clickable(art,'dashboard');for(const dx of [-.4,.4])box('#53644f',x+dx,.56,-5.6,.035,1.1,.035);}
// A light glass meeting partition, meeting table and lounge.
const glassMaterial=new T.MeshBasicMaterial({color:'#91b2a0',transparent:true,opacity:.1,depthWrite:false,side:T.DoubleSide});const glass=new T.Mesh(new T.PlaneGeometry(5.3,2.8),glassMaterial);glass.position.set(7,1.4,1.8);scene.add(glass);for(const x of [4.35,9.65])box('#395341',x,1.4,1.8,.045,2.8,.045);box('#395341',7,2.8,1.8,5.35,.045,.045);
const table=clickable(box('#c5a779',7,.87,4,3.7,.14,1.5),'meeting');for(const x of [5.8,8.2]){box('#52624d',x,.45,4,.08,.8,.7);chair(x,2.9);chair(x,5.1);}
softBox('#aa99bb',-3.8,.47,4.8,4.3,.65,1.18);box('#b5a7c4',-3.8,.91,5.28,4.3,.65,.18);for(const x of [-6,-1.6])box('#a394b5',x,.7,4.8,.26,.8,1.2);softBox('#c1a77c',-3.8,.45,3.05,1.8,.12,.95,.4);for(const x of [-4.4,-3.2])box('#675c45',x,.25,3.05,.06,.4,.55);
// An open executive suite: a visible doorway, low storage and transparent glazing.
// No opaque full-height walls, so the office remains usable from every angle.
const room=executiveOffice.bounds;
box('#637b68',7.2,.075,-3.75,5.45,.035,4.55);
box('#a5b59a',7.2,.098,-3.75,5.1,.012,4.22);
for(const [z,length]of [[-4.9,2.4],[-1.95,1.1]]){
 const pane=new T.Mesh(new T.PlaneGeometry(length,2.5),glassMaterial);pane.rotation.y=Math.PI/2;pane.position.set(room.left,1.3,z);scene.add(pane);
 box('#526452',room.left,2.55,z,.045,.045,length);
}
for(const z of [room.back,-3.7,-2.4,room.front])box('#526452',room.left,1.3,z,.045,2.5,.045);
box('#bb9b68',room.left,.08,-4.9,.07,.09,2.4);box('#bb9b68',room.left,.08,-1.95,.07,.09,1.1);
// Doorway marker and reporting rug are low enough to leave faces and legs visible.
box('#ddc393',room.left,.105,-2.95,.42,.015,1.2);
clickable(box('#dbcfad',6.85,.12,-2.95,1.05,.025,.65),'dashboard');
box('#a58a5e',8.1,.52,-5.85,3.35,.96,.42);box('#e5ddc6',8.1,1.02,-5.85,3.45,.07,.48);
for(const x of [6.75,7.42,8.09,8.76,9.43])box('#7d6c4e',x,.52,-5.61,.025,.8,.02);
for(const [i,color]of ['#516b5b','#bca47c','#a28b9d','#d3c7a3'].entries())box(color,8.25+i*.16,1.18,-5.85,.10,.25,.24);
plant(9.4,-5.1);
chair(9.1,-2.6,'#a39580');
box('#c3a577',9.55,.42,-1.95,.46,.08,.46);box('#526452',9.55,.22,-1.95,.06,.38,.06);
clickable(label('대표실',7.15,2.95,-5.7,1.7),'dashboard');
// Restore the glass meeting-room volume without closing the orbiting view.
for(const x of [4.35,9.65]){const pane=new T.Mesh(new T.PlaneGeometry(x===4.35?2.5:4.2,2.8),glassMaterial);pane.rotation.y=Math.PI/2;pane.position.set(x,1.4,x===4.35?4.75:3.9);scene.add(pane);box('#395341',x,2.8,3.9,.045,.045,4.2);box('#395341',x,1.4,6,.045,2.8,.045);}
box('#395341',7,2.8,6,5.35,.045,.045);box('#395341',4.35,1.4,3.5,.045,2.8,.045);
furnishOffice(scene,woodTexture);
// Original compact game characters: seated bodies, working hands and walking legs.
function crew(provider,id,x,z,variant=0,lounge=false){const actor=createGameCrew({variant,owner:provider==='owner',lounge});actor.position.set(x,1.08,z);scene.add(actor);clickable(actor,id);actors.set(id,actor);return actor;}
for(const [i,e]of employees.entries()){const pos=e.standing|| (e.provider==='muse'?[6.85,-.8]:e.lounge?[e.provider==='gpt'?-4.8:-2.8,4.75]:[e.desk[0]-.15,e.desk[1]-.75]);const actor=crew(e.provider,e.id,...pos,i+1,!!e.lounge);if(e.standing){actor.userData.setStanding();actor.rotation.y=e.provider==='claude'?1.3:-1.2;actor.userData.homeRotation=actor.rotation.y;}}
crew('owner','dashboard',...executiveOffice.owner,0);
for(const [id,name,x,z]of [['gpt','GPT',-6,0],['claude','CLAUDE',-2.4,0],['gemini','GEMINI',.9,-2.8],['copilot','COPILOT',.9,1.65]])clickable(label(name,x,2.65,z,1.6),'team:'+id);
clickable(label('MUSE',7,2.65,0,1.3),'team:muse');
const ui=document.createElement('div');ui.className='hybrid-office-ui';root.append(ui);const bubble=document.createElement('button');bubble.className='hybrid-report-bubble';bubble.hidden=true;ui.append(bubble);
let reportActor=null,home=null,reportDestination=null,reportOpen=null,reportPath=null,reportOwner=false;
function sprite(){return document.createElement('span');}
function settleReport(actor,arrived){actor.rotation.y=0;if(arrived){actor.userData.setStanding();const target=reportOwner?executiveOffice.owner:executiveOffice.chief;actor.rotation.y=Math.atan2(target[0]-actor.position.x,target[1]-actor.position.z);}else{const employee=employees.find(e=>e.id===actor.userData.action);if(employee?.standing){actor.userData.setStanding();actor.rotation.y=actor.userData.homeRotation||0;}else actor.userData.setWalking(false);}}
function startTrip(points,done){if(!reportActor){done?.();return;}if(points.length<2){reportActor.position.copy(points[0]);settleReport(reportActor,false);moving=null;done?.();invalidate();return;}reportActor.userData.setWalking(true);const to=points.at(-1),distance=points.slice(1).reduce((sum,p,i)=>sum+p.distanceTo(points[i]),0);moving={actor:reportActor,from:points[0],to:to.clone(),points,duration:Math.max(1400,Math.min(6500,distance*280)),elapsed:0,last:0,done,kind:'report'};
 if(reduced.matches){reportActor.position.copy(to);settleReport(reportActor,to.distanceTo(reportDestination)<.001);moving=null;done?.();}invalidate();}
const movement={visit(report,open){stopAmbient();scheduleAmbient();reportActor=actors.get(report.employeeId);if(!reportActor)return;home=reportActor.position.clone();reportOwner=report.owner;const employee=employees.find(e=>e.id===report.employeeId);reportPath=buildReportRoute([home.x,home.z],{owner:report.owner,lounge:!!employee?.lounge,standing:!!employee?.standing}).map(([x,z])=>V(x,1.08,z));reportDestination=reportPath.at(-1);reportOpen=open;bubble.textContent=report.owner?'대표님, 보고드릴 내용이 있어요.':'비서실장에게 전달할 내용이 있어요.';bubble.onclick=open;startTrip(reportPath,()=>{bubble.hidden=false;invalidate();});},
 returnHome(){bubble.hidden=true;const path=moving?.kind==='report'?[reportActor.position.clone(),...reportPath.slice(0,(moving.segment??0)+1).reverse()]:[...reportPath].reverse();const unique=path.filter((p,i)=>!i||p.distanceTo(path[i-1])>.001);return new Promise(resolve=>startTrip(unique,()=>{reportActor=null;reportPath=null;scheduleAmbient();resolve();}));},
 clear(){moving=null;bubble.hidden=true;if(reportActor&&home){reportActor.position.copy(home);settleReport(reportActor,false);}reportActor=null;reportPath=null;scheduleAmbient();invalidate();},isMoving:()=>moving?.kind==='report'};
reports=attachOfficeReports({floor:ui,sprite,movement});
function updateTrip(time){if(!moving||paused)return;const m=moving,previous=m.actor.position.clone(),dt=m.last?Math.min(time-m.last,150):0;m.last=time;m.elapsed+=dt;
 const t=Math.min(1,m.elapsed/(m.duration||2000)),p=t<.5?2*t*t:1-(-2*t+2)**2/2;
 // Parameterise by distance, so short doorway segments do not cause speed jumps.
 const lengths=m.points.slice(1).map((point,i)=>point.distanceTo(m.points[i])),total=lengths.reduce((a,b)=>a+b,0);let remaining=p*total,index=0;
 while(index<lengths.length-1&&remaining>lengths[index])remaining-=lengths[index++];m.segment=index;
 m.actor.position.lerpVectors(m.points[index],m.points[index+1],lengths[index]?remaining/lengths[index]:1);m.actor.position.y=1.08+Math.abs(Math.sin(m.elapsed*.013))*.025;
 const dx=m.actor.position.x-previous.x,dz=m.actor.position.z-previous.z;if(Math.hypot(dx,dz)>.0001)m.actor.rotation.y=Math.atan2(dx,dz);
 if(t>=1){m.actor.position.copy(m.to);if(m.kind==='report')settleReport(m.actor,m.to.distanceTo(reportDestination)<.001);else{m.actor.rotation.y=0;m.actor.userData.setWalking(false);}moving=null;m.done?.();}}
// Occasional visual routines, never an AI task or a fabricated work result.
let jobWorkers=new Set();
window.addEventListener('office-jobs-updated',e=>{jobWorkers=new Set(e.detail.filter(s=>s.state==='working').map(s=>s.seat));if(ambient&&jobWorkers.has(ambient.employeeId))stopAmbient();invalidate();});
function scheduleAmbient(delay=12000){clearTimeout(ambientTimer);ambientTimer=null;if(paused||document.hidden||reduced.matches)return;ambientTimer=setTimeout(()=>{ambientTimer=null;beginAmbient();},delay);}
function settleAmbient(){if(!ambient)return;const e=employees.find(e=>e.id===ambient.employeeId);if(e?.standing)ambient.actor.userData.setStanding();else ambient.actor.userData.setWalking(false);ambient.actor.rotation.y=ambient.actor.userData.homeRotation||0;}
function stopAmbient(){clearTimeout(breakTimer);breakTimer=null;if(!ambient)return;if(moving?.kind==='ambient')moving=null;ambient.actor.position.copy(ambient.home);settleAmbient();ambient=null;invalidate();}
function holdAmbient(){if(!ambient)return;ambient.actor.userData.setStanding();ambient.actor.rotation.y=Math.atan2(ambient.lookAt[0]-ambient.actor.position.x,ambient.lookAt[1]-ambient.actor.position.z);ambient.phase='break';if(paused||document.hidden)return;breakTimer=setTimeout(()=>{breakTimer=null;returnAmbient();},3000);}
function ambientTrip(points,done){ambient.actor.userData.setWalking(true);const distance=points.slice(1).reduce((sum,p,i)=>sum+p.distanceTo(points[i]),0);moving={actor:ambient.actor,from:points[0],to:points.at(-1),points,duration:Math.max(2800,Math.min(6000,distance*600)),elapsed:0,last:0,done,kind:'ambient'};invalidate();}
function returnAmbient(){if(!ambient)return;ambient.phase='return';ambientTrip([...ambient.path].reverse(),()=>{if(ambient)ambient.actor.position.copy(ambient.home);settleAmbient();ambient=null;scheduleAmbient();});}
function beginAmbient(){if(paused||document.hidden||reduced.matches)return;if(moving||reportActor||document.querySelector('dialog[open]')){scheduleAmbient(5000);return;}
 const id=roamingStaff[ambientTurn++%roamingStaff.length];if(jobWorkers.has(id)){scheduleAmbient(5000);return;}const actor=actors.get(id),home=actor.position.clone(),route=ambientRoute(id,[home.x,home.z]),path=route.points.map(([x,z])=>V(x,1.08,z));
 ambient={employeeId:id,actor,home,path,place:route.place,lookAt:route.lookAt,phase:'outbound'};ambientTrip(path,holdAmbient);}
function scheduleWork(delay=3500){clearTimeout(workTimer);workTimer=null;if(paused||document.hidden||reduced.matches)return;workTimer=setTimeout(()=>{if(document.querySelector('dialog[open]')){scheduleWork(3000);return;}workStarted=performance.now();workUntil=workStarted+1800;invalidate();scheduleWork(6000);},delay);}
function positionBubble(){if(bubble.hidden||!reportActor)return;const p=reportActor.position.clone().add(V(0,1,0)).project(camera);bubble.style.left=((p.x+1)*root.clientWidth/2)+'px';bubble.style.top=((1-p.y)*root.clientHeight/2)+'px';}
function invalidate(){if(document.hidden||frame!==null||timer!==null)return;const delay=Math.max(0,1000/(moving||performance.now()<workUntil||jobWorkers.size?12:24)-(performance.now()-lastFrame));timer=setTimeout(()=>{timer=null;frame=requestAnimationFrame(draw);},delay);}
function draw(time){frame=null;if(document.hidden)return;updateTrip(time);const working=!paused&&!reduced.matches&&(time<workUntil||jobWorkers.size>0);for(const actor of actors.values())actor.userData.animate(time,!paused&&!reduced.matches&&(actor===moving?.actor||(jobWorkers.has(actor.userData.action))||(working&&time<workUntil)));for(const plane of billboards){if(plane.userData.crew)plane.rotation.set(0,Math.atan2(camera.position.x-plane.position.x,camera.position.z-plane.position.z),0);else plane.quaternion.copy(camera.quaternion);}renderer.render(scene,camera);positionBubble();frames++;lastFrame=time;if((moving||working)&&!paused)invalidate();}
function fit(){camera.zoom=1;camera.updateMatrixWorld();camera.updateProjectionMatrix();const points=[];for(const x of [-10.5,10.5])for(const y of [0,3.2])for(const z of [-6.4,6.4])points.push(V(x,y,z).project(camera));const xs=points.map(p=>p.x),ys=points.map(p=>p.y);camera.zoom=Math.min(1.8/(Math.max(...xs)-Math.min(...xs)),1.5/(Math.max(...ys)-Math.min(...ys)));camera.updateProjectionMatrix();}
function resize(){const w=root.clientWidth,h=root.clientHeight;renderer.setSize(w,h);camera.left=-12*w/h;camera.right=12*w/h;camera.top=12;camera.bottom=-12;camera.updateProjectionMatrix();if(focused==='overview')fit();invalidate();}
function overview(){focused='overview';controls.target.set(0,.8,0);camera.position.set(19,17,24);controls.update();fit();invalidate();}
function focus(x,z,zoom=1.8){focused='detail';controls.target.set(x,.8,z);camera.position.set(x+10,10,z+14);camera.zoom=zoom;camera.updateProjectionMatrix();controls.update();invalidate();}
controls.addEventListener('change',invalidate);new ResizeObserver(resize).observe(root);
const ray=new T.Raycaster(),mouse=new T.Vector2();let down;
function hit(event){const rect=renderer.domElement.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObjects(pickables,true)[0]?.object;}
renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5){let object=hit(e);while(object&&!object.userData.action)object=object.parent;const id=object?.userData.action;if(id?.startsWith('team:'))emit('office-team-open',id.slice(5));else if(id==='dashboard')emit('office-dashboard-open');else if(id==='meeting')emit('office-meeting-open');else if(id){if(reportActor===object&&reportOpen)reportOpen();else emit('office-assign',id);}}down=null;});
for(const id of ['owner-profile','owner-view'])document.getElementById(id).onclick=()=>focus(7.1,-3.65,2.65);document.querySelector('#lounge-view').onclick=()=>focus(-3.8,4.5,2);document.querySelector('#staff-view').onclick=()=>focus(-3.5,-.5,1.7);document.querySelector('#reset-view').onclick=overview;
const motion=document.querySelector('#motion');motion.textContent='Ⅱ';motion.onclick=()=>{paused=!paused;if(paused){clearTimeout(workTimer);workTimer=null;workUntil=0;}else scheduleWork(300);motion.textContent=paused?'▶':'Ⅱ';motion.setAttribute('aria-pressed',String(paused));if(moving)moving.last=0;if(paused){clearTimeout(ambientTimer);clearTimeout(breakTimer);ambientTimer=breakTimer=null;}else if(ambient?.phase==='break')holdAmbient();else if(!ambient)scheduleAmbient(2500);invalidate();};
window.addEventListener('office-team',e=>{const p=e.detail==='muse'?[7,0]:employees.find(a=>a.provider===e.detail&&a.desk)?.desk;if(p)focus(...p,1.7);});
window.addEventListener('office-meeting-view',()=>focus(7,4,1.9));document.querySelector('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(workTimer);workTimer=null;workUntil=0;if(frame!==null)cancelAnimationFrame(frame);if(timer!==null)clearTimeout(timer);frame=timer=null;clearTimeout(ambientTimer);clearTimeout(breakTimer);ambientTimer=breakTimer=null;if(moving)moving.last=0;}else{scheduleWork(500);if(ambient?.phase==='break')holdAmbient();else if(!ambient)scheduleAmbient(2500);invalidate();}});
reduced.addEventListener('change',()=>{if(reduced.matches){clearTimeout(workTimer);workTimer=null;workUntil=0;stopAmbient();clearTimeout(ambientTimer);ambientTimer=null;}else{scheduleAmbient(2500);scheduleWork(500);}invalidate();});
window.officeView={getState:()=>({webgl:true,renderMode:'hybrid',characterMode:'3d-game-crew',workAnimation:{active:!paused&&!reduced.matches&&performance.now()<workUntil,started:workStarted,frameCap:12},pixelRatio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled,frameCap:24,ambientFrameCap:12,renderedFrames:frames,moving:!!moving,ambient:ambient?{employeeId:ambient.employeeId,phase:ambient.phase,place:ambient.place,position:ambient.actor.position.toArray()}:null,paused,staffCount:employees.length,reports:reports.state(),executiveOffice:{entrance:executiveOffice.entrance,reportSpot:executiveOffice.report,reporter:reportActor?{position:reportActor.position.toArray(),rotation:reportActor.rotation.y,destination:reportOwner?'대표실':'비서실'}:null},drawCalls:renderer.info.render.calls,textures:renderer.info.memory.textures,locations:employees.map(e=>({id:e.id,pose:actors.get(e.id).userData.pose,location:actors.get(e.id)===reportActor?'보고 중':ambient?.employeeId===e.id?(ambient.phase==='break'?ambient.place+' · 서 있음':ambient.place+' 이동'):e.provider==='muse'?'비서실':e.standing?e.station+' · 서 있음':e.lounge?'라운지':'업무석'}))}),deskPoint(id){const object=actors.get(id);if(!object)return null;const p=object.position.clone().project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}};
const meta=document.querySelector('.footer-meta span:last-child');meta.textContent='작은 회사 · 직원 클릭으로 업무 연결 · 드래그 회전';document.querySelector('#loading').classList.add('ready');document.querySelector('#loading').hidden=true;overview();resize();

scheduleAmbient(1500);scheduleWork(500);
