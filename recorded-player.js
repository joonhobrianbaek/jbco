import * as T from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const rim=new T.Vector3(0,3.05,-5.8),g=9.81;
const profiles={
 dribble:{name:'CMU_06_15_Dribble_Shoot',gather:1.45,release:2.82,flight:1.12,label:'CMU 06_15 · 드리블 / 슛'},
 jumper:{name:'CMU_124_03_Basketball_Shoot',gather:3.45,release:4.17,flight:1.20,label:'CMU 124_03 · 점프슛'}
};
export class RecordedPlayer{
 constructor(scene){this.scene=scene;this.ready=false;this.mode='dribble';this.blendDuration=.8;this.bones=new Map();}
 async load(onProgress){const asset=await new GLTFLoader().loadAsync('./assets/player-mocap.glb',onProgress);this.model=asset.scene;this.model.scale.setScalar(1.08);this.model.position.set(0,.025,2);this.scene.add(this.model);this.meshes=[];this.model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.isSkinnedMesh){this.meshes.push(o);o.frustumCulled=false;}}if(o.isBone)this.bones.set(o.name.replace(/[^a-z0-9]/gi,'').toLowerCase(),o);});this.mixer=new T.AnimationMixer(this.model);this.clips=asset.animations;this.ready=true;this.setMode('dribble');return this;}
 bone(name){return this.bones.get(name.replace(/[^a-z0-9]/gi,'').toLowerCase());}
 point(name){return this.bone(name)?.getWorldPosition(new T.Vector3())||this.model.position.clone();}
 palm(side,tip=false){const wrist=this.point('Bip01 '+side+' Hand');return wrist.lerp(this.point('Bip01 '+side+(tip?' Finger22':' Finger2')),tip?1:.7);}
 sample(time,blend=0){this.primary.time=Math.max(0,Math.min(this.captureDuration-1e-5,time));this.secondary.time=0;this.primary.setEffectiveWeight(1-blend);this.secondary.setEffectiveWeight(blend);this.mixer.update(0);this.model.updateMatrixWorld(true);}
 setMode(mode){if(!this.ready||!profiles[mode])return;this.mode=mode;this.profile=profiles[mode];this.mixer.stopAllAction();const clip=this.clips.find(c=>c.name===this.profile.name);if(!clip)throw new Error('Recorded clip unavailable');this.captureDuration=clip.duration;this.duration=this.captureDuration+this.blendDuration;this.primary=this.mixer.clipAction(clip).reset().play();this.secondary=this.mixer.clipAction(clip.clone()).reset().play();this.secondary.setEffectiveWeight(0);this.sample(this.profile.release);this.releasePosition=this.palm('R',true).add(new T.Vector3(0,.075,-.025));const flight=this.profile.flight;this.velocity=rim.clone().sub(this.releasePosition).divideScalar(flight);this.velocity.y+=.5*g*flight;this.swish=this.profile.release+flight;this.floorTime=this.swish+(-4+Math.sqrt(16+2*g*(3.05-.12)))/g;this.sample(0);this.firstBall=this.dribble(0);this.sample(this.captureDuration-1e-5);this.lastBall=this.recordedBall(this.captureDuration-1e-5);this.sample(0);}
 dribble(time){const l=this.palm('L'),r=this.palm('R'),choose=clamp((l.y-r.y)*8+.5),contact=l.lerp(r,choose);const phase=((time%.60)+.60)%.60/.60;const bounce=(2*phase-1)**2;const height=Math.max(.55,contact.y-.12);return new T.Vector3(contact.x,.12+(height-.12)*bounce,contact.z-.035);}
 fall(time){const age=time-this.swish;return new T.Vector3(-.025*age,3.05-4*age-.5*g*age*age,-5.8-.45*age);}
 recordedBall(time){const p=this.profile;
  if(time<p.gather)return this.dribble(time);
  if(time<p.release){const held=this.palm('L').add(this.palm('R')).multiplyScalar(.5).add(new T.Vector3(0,.045,-.025));const shot=this.palm('R',true).add(new T.Vector3(0,.075,-.025));const gather=smooth((time-p.gather)/.22);const center=this.dribble(time).lerp(held,gather);return center.lerp(shot,smooth((time-(p.release-.3))/.3));}
  if(time<this.swish){const dt=time-p.release;return this.releasePosition.clone().addScaledVector(this.velocity,dt).add(new T.Vector3(0,-.5*g*dt*dt,0));}
  if(time<this.floorTime)return this.fall(time);
  const u=clamp((time-this.floorTime)/.85),ground=this.fall(this.floorTime);const result=ground.lerp(this.dribble(time),smooth(u));result.y+=.38*Math.sin(Math.PI*u);return result;
 }
 update(time,ball){if(!this.ready)return null;const t=((time%this.duration)+this.duration)%this.duration;const blend=t>=this.captureDuration?smooth((t-this.captureDuration)/this.blendDuration):0;this.sample(Math.min(t,this.captureDuration-1e-5),blend);let position;if(blend>0){position=this.lastBall.clone().lerp(this.firstBall,blend);position.y+=.25*Math.sin(Math.PI*blend);}else position=this.recordedBall(t);ball.position.copy(position);ball.rotation.set(t*Math.PI*2,t*Math.PI*.6,t*Math.PI*.2);
  let phase=t>=this.captureDuration?'LOOP BLEND':t<this.profile.gather?'DRIBBLE':t<this.profile.release-.25?'GATHER':t<this.profile.release?'RISE':t<this.profile.release+.2?'RELEASE':t<this.swish?'FOLLOW THROUGH':t<this.floorTime?'SHOT MADE':'RESET';
  const left=this.point('Bip01 L Toe0'),right=this.point('Bip01 R Toe0');this.state={time:t,phase,blend,source:this.profile.label,ball:position.toArray(),leftContact:left.y<.065,rightContact:right.y<.065,leftFoot:left.toArray(),rightFoot:right.toArray(),rightHand:this.palm('R').toArray()};return this.state;
 }
 diagnostics(){const mesh=this.meshes[0],v=mesh.getVertexPosition(Math.min(500,mesh.geometry.attributes.position.count-1),new T.Vector3());mesh.localToWorld(v);return {...this.state,mode:this.mode,boneCount:this.bones.size,skinnedMeshCount:this.meshes.length,animationTracks:this.primary.getClip().tracks.length,captureDuration:this.captureDuration,duration:this.duration,hasSkinWeights:!!mesh.geometry.attributes.skinWeight,deformedVertex:v.toArray(),releasePosition:this.releasePosition.toArray()};}
 set visible(value){if(this.model)this.model.visible=value;}
}
