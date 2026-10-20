export const LOOP=10;
export const RELEASE=3.37;
export const SWISH=4.65;
export const GRAVITY=9.81;
const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const blend=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
function movingFoot(from,to,t){const u=clamp(t),s=smooth(u);const p=blend(from,to,s);p[1]+=.105*Math.sin(Math.PI*u);return p;}
const leftStart=[-.20,.115,1.00],rightStart=[.22,.115,1.34],leftEnd=[-.20,.115,2.10],rightEnd=[.22,.115,2.44];
export function poseAt(time){
 const t=((time%LOOP)+LOOP)%LOOP;
 let left=[...leftStart],right=[...rightStart];
 if(t>=2){right=movingFoot(rightStart,rightEnd,(t-2)/.35);left=movingFoot(leftStart,leftEnd,(t-2.25)/.40);}
 if(t>=7){left=movingFoot(leftEnd,leftStart,(t-7)/.65);right=movingFoot(rightEnd,rightStart,(t-7.45)/.65);}
 let z=1.17+1.1*smooth((t-2)/.65)-1.1*smooth((t-7)/1.10);
 let crouch=.06+.20*smooth((t-1.4)/.6);
 if(t>=2.65)crouch=.26-.07*smooth((t-2.65)/.4);
 const flight=clamp((t-3.05)/.8),airborne=t>3.05&&t<3.85;
 const lift=airborne?4*.34*flight*(1-flight):0;
 if(t>=3.05)crouch=.19*(1-smooth((t-3.05)/.13));
 if(t>=3.85)crouch=.19*Math.sin(Math.PI*clamp((t-3.85)/.48));
 if(t>=4.33)crouch=.045*smooth((t-5)/.6);
 if(t>=7&&t<8.1)crouch+=.14*Math.sin(Math.PI*(t-7)/1.1);
 if(t>=8.1)crouch=mix(.045,.06,smooth((t-8.1)/1.2));
 left[1]+=lift;right[1]+=lift;
 const pelvis=.99-crouch+lift;
 const root=[0,pelvis,z];
 const shotLift=smooth((t-2.65)/.72);
 let held=[.08,pelvis+.17+1.03*shotLift,z-.37];
 const lean=t<2.65?.10:.04;
 let phase=t<1.4?'DRIBBLE':t<2?'GATHER':t<2.65?'STEPBACK':t<3.05?'LOAD':t<RELEASE?'RISE':t<3.85?'RELEASE':t<4.33?'LAND':t<5.6?'FOLLOW THROUGH':t<8.1?'RESET':'DRIBBLE';
 return {t,root,left,right,lift,crouch,held,lean,shotLift,phase,leftContact:left[1]<.117,rightContact:right[1]<.117};
}
export function dribbleAt(t,root){const p=t>=9.1?(t-9.1)/.9:((t%.7)+.7)%.7/.7;return [root[0]+.43,.125+.755*(2*p-1)**2,root[2]-.22];}
export function releasePosition(){return poseAt(RELEASE).held;}
export function shotAt(time){const start=releasePosition(),end=[0,3.05,-5.80],duration=SWISH-RELEASE,dt=time-RELEASE;
 const velocity=[(end[0]-start[0])/duration,(end[1]-start[1]+.5*GRAVITY*duration*duration)/duration,(end[2]-start[2])/duration];
 return start.map((v,i)=>v+velocity[i]*dt-(i===1?.5*GRAVITY*dt*dt:0));}
export const FLOOR_HIT=SWISH+(-4+Math.sqrt(16+2*GRAVITY*(3.05-.125)))/GRAVITY;
function netFall(t){const age=t-SWISH;return [-.04*age,3.05-4*age-.5*GRAVITY*age*age,-5.8-.5*age];}
export function ballAt(time){const p=poseAt(time),t=p.t;
 if(t<1.4)return {position:dribbleAt(t,p.root),mode:'DRIBBLE'};
 if(t<1.75){const at=poseAt(1.4);return {position:blend(dribbleAt(1.4,at.root),p.held,smooth((t-1.4)/.35)),mode:'GATHER'};}
 if(t<RELEASE)return {position:p.held,mode:'HELD'};
 if(t<SWISH)return {position:shotAt(t),mode:'SHOT'};
 if(t<FLOOR_HIT)return {position:netFall(t),mode:'NET'};
 // A low automatic bounce pass returns the practice ball as the player resets.
 if(t<7){const u=(t-FLOOR_HIT)/(7-FLOOR_HIT),pos=blend(netFall(FLOOR_HIT),[-.02,.125,-6.4],smooth(u));pos[1]=.125+Math.abs(Math.sin(u*Math.PI*2))*.24*(1-u);return {position:pos,mode:'RETURN'};}
 const destination=dribbleAt(9.1,poseAt(9.1).root);
 if(t<9.1){const u=(t-7)/2.1;const pos=blend([-.02,.125,-6.4],destination,smooth(u));pos[1]+=.7*Math.sin(Math.PI*u);return {position:pos,mode:'RETURN'};}
 return {position:dribbleAt(t,p.root),mode:'DRIBBLE'};
}
