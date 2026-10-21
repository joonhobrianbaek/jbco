import * as T from 'three';
const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
// Bend the existing skinned arms toward lap/conversation targets; keep their lengths.
function reach(worker,side,target){
 const bone=n=>worker.bones.get(('Bip01 '+side+' '+n).replace(/[^a-z0-9]/gi,'').toLowerCase());
 const hand=bone('Hand');
 for(let i=0;i<4;i++)for(const joint of [bone('Forearm'),bone('UpperArm')]){
  const origin=joint.getWorldPosition(v()),from=hand.getWorldPosition(v()).sub(origin),to=target.clone().sub(origin);
  const turn=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
  const world=joint.getWorldQuaternion(new T.Quaternion()).premultiply(turn);
  joint.quaternion.copy(joint.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(world));joint.updateWorldMatrix(false,true);
 }
}
// Solve seated legs from their real segment lengths, with knees forward and ankles above the floor.
function seatLeg(worker,side){
 const bone=n=>worker.bones.get(('Bip01 '+side+' '+n).replace(/[^a-z0-9]/gi,'').toLowerCase());
 const thigh=bone('Thigh'),calf=bone('Calf'),foot=bone('Foot');
 const hip=thigh.getWorldPosition(v()),knee=calf.getWorldPosition(v()),ankle=foot.getWorldPosition(v());
 const upper=hip.distanceTo(knee),lower=knee.distanceTo(ankle),footRotation=foot.getWorldQuaternion(new T.Quaternion());
 const localHip=worker.person.worldToLocal(hip.clone());
 const target=worker.person.localToWorld(v(localHip.x,0,worker.activity==='gaming'?.46:.38));target.y=.12;
 const direction=target.clone().sub(hip),distance=T.MathUtils.clamp(direction.length(),Math.abs(upper-lower)+.001,upper+lower-.003);direction.normalize();target.copy(hip).addScaledVector(direction,distance);
 const forward=v(0,0,1).transformDirection(worker.person.matrixWorld);
 const bend=forward.addScaledVector(direction,-forward.dot(direction)).normalize();
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const bendHeight=Math.sqrt(Math.max(0,upper*upper-along*along));
 const desiredKnee=hip.clone().addScaledVector(direction,along).addScaledVector(bend,bendHeight);
 function aim(joint,child,point){const origin=joint.getWorldPosition(v()),from=child.getWorldPosition(v()).sub(origin).normalize(),to=point.clone().sub(origin).normalize();const q=joint.getWorldQuaternion(new T.Quaternion()).premultiply(new T.Quaternion().setFromUnitVectors(from,to));joint.quaternion.copy(joint.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));joint.updateWorldMatrix(false,true);}
 aim(thigh,calf,desiredKnee);aim(calf,foot,target);
 foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(footRotation));foot.updateWorldMatrix(false,true);
}
export function createLoungeStaff(scene,detail,assets){
 return [
  {asset:'muse',x:7.03,z:2.98,y:.1,angle:Math.PI/2,activity:'conversation'},
  {asset:'copilot',x:7.03,z:4.22,y:.1,angle:Math.PI/2,activity:'reading'},
  {asset:'gemini',x:4.02,z:3,y:-.08,angle:-Math.PI/2,activity:'gaming'}
 ].map((config,i)=>{
  const seat=new T.Group();seat.position.set(config.x,config.y,config.z);seat.rotation.y=config.angle;scene.add(seat);
  const w=detail.createDetailedStaff(seat,assets[config.asset],{paid:false},i+2);w.person.position.z=0;
  w.activity=config.activity;w.base=[...w.bones.values()].map(b=>[b,b.quaternion.clone()]);
  if(config.activity==='reading'){
   const book=new T.Mesh(new T.BoxGeometry(.32,.025,.23),new T.MeshStandardMaterial({color:'#315e59',roughness:.9}));book.position.set(0,.75,-.27);book.rotation.x=.18;seat.add(book);
   const pages=new T.Mesh(new T.BoxGeometry(.30,.012,.21),new T.MeshStandardMaterial({color:'#f2e8d1'}));pages.position.y=.018;book.add(pages);
  }
  if(config.activity==='gaming'){
   const pad=new T.Group();pad.position.set(0,.72,-.25);seat.add(pad);
   const plastic=new T.MeshStandardMaterial({color:'#273136',roughness:.65});
   pad.add(new T.Mesh(new T.BoxGeometry(.23,.055,.12),plastic));
   for(const side of [-1,1]){const grip=new T.Mesh(new T.SphereGeometry(.065,12,8),plastic);grip.position.x=side*.10;grip.scale.set(.8,.55,1);pad.add(grip);}
   for(const [x,z,color] of [[-.075,0,'#b6cbc1'],[.065,-.025,'#d3b66c'],[.09,.01,'#8db9a8']]){const button=new T.Mesh(new T.SphereGeometry(.012,8,6),new T.MeshStandardMaterial({color}));button.position.set(x,.034,z);pad.add(button);}
  }
  return w;
 });
}
export function animateLoungeStaff(w,time){
 if(w.lastLoungeTime===time)return;w.lastLoungeTime=time;
 w.mixer.setTime(time+w.index*.37);for(const [bone,q] of w.base)bone.quaternion.copy(q);
 const head=w.bones.get('bip01head');if(head){head.rotateY(Math.sin(time*.6+w.index)*.12);head.rotateX((w.activity==='gaming'?.16:0)+Math.sin(time*.9+w.index)*.035);}
 w.person.updateWorldMatrix(true,true);
 for(const side of ['L','R'])seatLeg(w,side);
 const talk=w.activity==='conversation',read=w.activity==='reading',game=w.activity==='gaming';
 for(const [side,sign] of [['L',1],['R',-1]]){
  const gesture=talk&&side==='L';
  const target=v(sign*(gesture?.28:game?.12:.16),gesture?.86+Math.sin(time*1.7)*.06:read?.77:game?.73:.71,gesture?.35:read?.29:game?.25:.22);
  reach(w,side,w.person.localToWorld(target));
 }
}
