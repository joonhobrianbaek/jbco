import * as T from 'three';
const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const armBone=(w,side,name)=>w.bones.get(('Bip01 '+side+' '+name).replace(/[^a-z0-9]/gi,'').toLowerCase());
// Two-bone arms keep their original lengths and the authored palm orientation.
export function restHand(worker,side,target,elbowHint){
 const upper=armBone(worker,side,'UpperArm'),fore=armBone(worker,side,'Forearm'),hand=armBone(worker,side,'Hand');
 const shoulder=upper.getWorldPosition(v()),elbow=fore.getWorldPosition(v()),wrist=hand.getWorldPosition(v());
 const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist),palm=hand.getWorldQuaternion(new T.Quaternion());
 const direction=target.clone().sub(shoulder),distance=T.MathUtils.clamp(direction.length(),Math.abs(a-b)+.001,a+b-.002);direction.normalize();target=shoulder.clone().addScaledVector(direction,distance);
 const bend=elbowHint.clone().sub(shoulder);bend.addScaledVector(direction,-bend.dot(direction));if(bend.lengthSq()<1e-8)bend.set(1,0,0).addScaledVector(direction,-direction.x);bend.normalize();
 const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));const desiredElbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height);
 function aim(joint,child,point){const origin=joint.getWorldPosition(v()),from=child.getWorldPosition(v()).sub(origin).normalize(),to=point.clone().sub(origin).normalize();const world=joint.getWorldQuaternion(new T.Quaternion()).premultiply(new T.Quaternion().setFromUnitVectors(from,to));joint.quaternion.copy(joint.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(world));joint.updateWorldMatrix(false,true);}
 aim(upper,fore,desiredElbow);aim(fore,hand,target);hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(palm));hand.updateWorldMatrix(false,true);
}
export function poseWorkingStaff(worker,time,mode='desk'){
 const key=mode+':'+time;if(worker.lastWorkPose===key)return;worker.lastWorkPose=key;
 worker.armBase||=['L','R'].flatMap(side=>['UpperArm','Forearm','Hand','Thigh','Calf','Foot'].map(name=>{const bone=armBone(worker,side,name);return [bone,bone.quaternion.clone()];}));for(const [bone,q] of worker.armBase)bone.quaternion.copy(q);worker.person.updateWorldMatrix(true,true);
 const pattern=mode==='owner'?0:worker.index%3;
 for(const [side,sign] of [['L',1],['R',-1]]){
  const lap=mode==='meeting'?side==='R':mode==='chief'?side==='L':pattern===2&&side==='L';
  const mouse=mode!=='meeting'&&pattern===1&&side==='R';
  const target=lap?v(sign*.16,.71,.19):v(mouse?-.46:sign*.17,.868+Math.sin(time*2+worker.index)*.0015,mouse?.47:.44);
  const hint=lap?v(sign*.27,.76,.06):v(sign*.30,.875,.16);
  restHand(worker,side,worker.person.localToWorld(target),worker.person.localToWorld(hint));const hip=worker.person.worldToLocal(armBone(worker,side,'Thigh').getWorldPosition(v())),foot=worker.person.localToWorld(v(hip.x,0,.38));foot.y=.12;placeFoot(worker,side,foot);
 }
}
export function placeFoot(worker,side,target){
 const upper=armBone(worker,side,'Thigh'),lower=armBone(worker,side,'Calf'),foot=armBone(worker,side,'Foot');const hip=upper.getWorldPosition(v()),knee=lower.getWorldPosition(v()),ankle=foot.getWorldPosition(v()),rotation=foot.getWorldQuaternion(new T.Quaternion());const a=hip.distanceTo(knee),b=knee.distanceTo(ankle),direction=target.clone().sub(hip),distance=T.MathUtils.clamp(direction.length(),Math.abs(a-b)+.001,a+b-.002);direction.normalize();target=hip.clone().addScaledVector(direction,distance);const forward=v(0,0,1).transformDirection(worker.person.matrixWorld),bend=forward.addScaledVector(direction,-forward.dot(direction)).normalize(),along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along)),desired=hip.clone().addScaledVector(direction,along).addScaledVector(bend,height);
 for(const [joint,child,point] of [[upper,lower,desired],[lower,foot,target]]){const origin=joint.getWorldPosition(v()),q=joint.getWorldQuaternion(new T.Quaternion()).premultiply(new T.Quaternion().setFromUnitVectors(child.getWorldPosition(v()).sub(origin).normalize(),point.clone().sub(origin).normalize()));joint.quaternion.copy(joint.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));joint.updateWorldMatrix(false,true);}foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(rotation));foot.updateWorldMatrix(false,true);
}
