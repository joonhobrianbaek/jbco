import * as T from 'three';
import {restHand,placeFoot} from './staff-poses.js?v=1';
const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),ease=t=>t*t*(3-2*t);
const bone=(w,side,n)=>w.bones.get(('Bip01 '+side+' '+n).replace(/[^a-z0-9]/gi,'').toLowerCase());
import {southPaths,meetingPath} from './staff-routes.js?v=1';
function worldPose(home){home.parent.updateWorldMatrix(true,false);return {position:home.parent.localToWorld(home.position.clone()),yaw:new T.Euler().setFromQuaternion(home.parent.getWorldQuaternion(new T.Quaternion()).multiply(home.rotation),'YXZ').y-Math.PI};}
export function createOfficeMotion(scene,{workers,homes,seats,door,loungeWorker}){
 let wanted=new Map(),active=null,elapsed=0,nextBreak=18,loungeAway=false;const loungeHome=loungeWorker?{parent:loungeWorker.person.parent,position:loungeWorker.person.position.clone(),rotation:loungeWorker.person.quaternion.clone()}:null;
 const beanbag=new T.Group();beanbag.position.set(4.02,-.08,3);beanbag.rotation.y=-Math.PI/2;scene.add(beanbag);const loungeOther={parent:beanbag,position:v(),rotation:new T.Quaternion().setFromAxisAngle(v(0,1,0),Math.PI)};
 function seated(w){return seats.indexOf(w.person.parent);}
 function begin(worker,goal,path,kind){
  const person=worker.person,startPosition=person.getWorldPosition(v()),startRotation=person.getWorldQuaternion(new T.Quaternion()),carrier=new T.Group();carrier.position.set(startPosition.x,0,startPosition.z);carrier.rotation.y=new T.Euler().setFromQuaternion(startRotation,'YXZ').y-Math.PI;scene.add(carrier);carrier.add(person);person.position.set(0,startPosition.y,0);person.rotation.set(0,Math.PI,0);worker.moving=true;worker.mixer.setTime(elapsed+worker.index*.37);person.updateWorldMatrix(true,true);
  const hip=person.worldToLocal(bone(worker,'L','Thigh').getWorldPosition(v())),length=bone(worker,'L','Thigh').getWorldPosition(v()).distanceTo(bone(worker,'L','Calf').getWorldPosition(v()))+bone(worker,'L','Calf').getWorldPosition(v()).distanceTo(bone(worker,'L','Foot').getWorldPosition(v()));
  active={worker,goal,end:worldPose(goal),carrier,kind,path:path.map(p=>v(p[0],0,p[1])),point:0,stage:'rising',stageTime:0,travel:0,startY:startPosition.y,standY:length*.96+.12-hip.y};
 }
 function pose(a,amount,stride){
  const w=a.worker;w.mixer.setTime(elapsed+w.index*.37);w.person.updateWorldMatrix(true,true);
  for(const [side,sign] of [['L',1],['R',-1]]){
   const phase=a.travel/.18+(side==='L'?0:Math.PI),hip=w.person.worldToLocal(bone(w,side,'Thigh').getWorldPosition(v())),target=w.person.localToWorld(v(hip.x,0,(1-amount)*.38+stride*.16*Math.sin(phase)));target.y=.12+stride*Math.max(0,Math.cos(phase))*.065;placeFoot(w,side,target);
   const hand=v(sign*.20,.71-(amount*.17),.19*(1-amount)-stride*.075*Math.sin(phase));restHand(w,side,w.person.localToWorld(hand),w.person.localToWorld(v(sign*.27,.80,.02)));
   if(amount>0){const wrist=bone(w,side,'Hand'),axis=v(1,0,0).transformDirection(w.person.matrixWorld),q=wrist.getWorldQuaternion(new T.Quaternion()).premultiply(new T.Quaternion().setFromAxisAngle(axis,amount*Math.PI/2));wrist.quaternion.copy(wrist.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));wrist.updateWorldMatrix(false,true);}
  }
 }
 function finish(a){const w=a.worker;a.goal.parent.add(w.person);w.person.position.copy(a.goal.position);w.person.quaternion.copy(a.goal.rotation);scene.remove(a.carrier);w.moving=false;w.lastWorkPose=null;w.lastLoungeTime=undefined;w.mixer.setTime(elapsed+w.index*.37);if(a.kind==='break'){loungeAway=!loungeAway;nextBreak=elapsed+32;}active=null;}
 return {
  setMeeting(destinations){wanted=new Map(destinations);},
  update(dt,time){elapsed=time;if(dt<=0)return;
   if(!active){for(const [w,home] of homes){const seat=wanted.get(w),goal=seat?{parent:seat,position:v(),rotation:new T.Quaternion().setFromAxisAngle(v(0,1,0),Math.PI)}:home;if(w.person.parent===goal.parent)continue;const occupant=seat&&workers.find(other=>other!==w&&other.person.parent===seat);if(occupant){const home=homes.get(occupant);if(home){begin(occupant,home,meetingPath(worldPose(home).position,seated(occupant),true),'meeting');break;}continue;}const from=seated(w),to=seats.indexOf(goal.parent);let path;if(from>=0&&to>=0)path=[...southPaths[from].slice().reverse(),...southPaths[to]];else if(to>=0)path=meetingPath(worldPose(home).position,to);else path=meetingPath(worldPose(home).position,from,true);begin(w,goal,path,'meeting');break;}
    if(!active&&loungeWorker&&elapsed>=nextBreak){const path=[[7.03,2.98],[6.55,2.98],[6.4,2.1],[4.85,1.1],[4.75,2.45],[4.55,2.85],[4.02,3]];begin(loungeWorker,loungeAway?loungeHome:loungeOther,loungeAway?path.reverse():path,'break');}
   }
   if(active){const a=active;a.stageTime+=dt;if(a.stage==='rising'){const t=Math.min(1,a.stageTime/.7);a.worker.person.position.y=T.MathUtils.lerp(a.startY,a.standY,ease(t));pose(a,ease(t),0);if(t===1){a.stage='walking';a.stageTime=0;}}
    else if(a.stage==='walking'){const target=a.path[a.point];if(!target){a.stage='sitting';a.stageTime=0;}else{const delta=target.clone().sub(a.carrier.position);delta.y=0;const distance=delta.length(),step=Math.min(distance,dt*.85);if(distance>.001){a.carrier.position.addScaledVector(delta,step/distance);a.travel+=step;const yaw=Math.atan2(-delta.x,-delta.z),turn=Math.atan2(Math.sin(yaw-a.carrier.rotation.y),Math.cos(yaw-a.carrier.rotation.y));a.carrier.rotation.y+=turn*Math.min(1,dt*10);}a.worker.person.position.y=a.standY+Math.sin(a.travel/.18*2)*.003;pose(a,1,1);if(distance<=step+.001)a.point++;}}
    else{const t=Math.min(1,a.stageTime/.7),amount=1-ease(t),turn=Math.atan2(Math.sin(a.end.yaw-a.carrier.rotation.y),Math.cos(a.end.yaw-a.carrier.rotation.y));a.carrier.rotation.y+=turn*Math.min(1,dt*12);a.worker.person.position.y=T.MathUtils.lerp(a.end.position.y,a.standY,amount);pose(a,amount,0);if(t===1)finish(a);}
   }
   if(door){const open=active?.kind==='meeting'?1:0;door.rotation.y=T.MathUtils.lerp(door.rotation.y,-Math.PI/2*open,Math.min(1,dt*5));}
  },
  state(){return {moving:active?{employeeId:active.worker.employee.id,stage:active.stage,kind:active.kind,position:active.carrier.position.toArray()}:null,queue:[...homes.keys()].filter(w=>!w.moving&&w.person.parent!==(wanted.get(w)||homes.get(w).parent)).map(w=>w.employee.id),loungeAway};}
 };
}
