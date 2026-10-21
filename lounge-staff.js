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
export function createLoungeStaff(scene,detail,assets){
 return [
  {asset:'muse',x:7.25,z:2.98,y:.1,angle:Math.PI/2,activity:'conversation'},
  {asset:'copilot',x:7.25,z:4.22,y:.1,angle:Math.PI/2,activity:'reading'},
  {asset:'gemini',x:3.8,z:3,y:-.15,angle:-Math.PI/2,activity:'gaming'}
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
 const talk=w.activity==='conversation',read=w.activity==='reading',game=w.activity==='gaming';
 for(const [side,sign] of [['L',1],['R',-1]]){
  const gesture=talk&&side==='L';
  const target=v(sign*(gesture?.28:game?.12:.16),gesture?.86+Math.sin(time*1.7)*.06:read?.77:game?.73:.71,gesture?.35:read?.29:game?.25:.22);
  reach(w,side,w.person.localToWorld(target));
 }
}
