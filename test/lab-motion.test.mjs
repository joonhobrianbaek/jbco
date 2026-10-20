import test from 'node:test';
import assert from 'node:assert/strict';
import {poseAt,ballAt,shotAt,RELEASE,SWISH,FLOOR_HIT,GRAVITY,LOOP} from '../public/lab-motion.js';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('planted feet keep their world positions as the pelvis retreats',()=>{
 const left=poseAt(1.9).left,right=poseAt(1.9).right;
 for(let t=2;t<2.25;t+=.01)assert.deepEqual(poseAt(t).left,left);
 assert.deepEqual(poseAt(1.99).right,right);
 assert(poseAt(2.65).root[2]>poseAt(1.9).root[2]+1);
 for(let t=2.65;t<3.05;t+=.01){assert.deepEqual(poseAt(t).left,poseAt(2.65).left);assert.deepEqual(poseAt(t).right,poseAt(2.65).right);}
});
test('leg targets remain reachable without telescoping bones',()=>{
 for(let t=0;t<LOOP;t+=.005){const p=poseAt(t);for(const [i,foot]of [p.left,p.right].entries()){const hip=[i?.125:-.125,p.root[1]-.03,p.root[2]];assert(distance(hip,foot)<=.9701,`unreachable foot at ${t}`);}}
});
test('shot releases from the held ball, obeys gravity and crosses the rim',()=>{
 assert(distance(ballAt(RELEASE-1e-7).position,ballAt(RELEASE+1e-7).position)<1e-4);
 assert(distance(shotAt(SWISH),[0,3.05,-5.8])<1e-10);
 const t=4,h=.01,a=shotAt(t-h),b=shotAt(t),c=shotAt(t+h);
 assert(Math.abs((c[1]-2*b[1]+a[1])/(h*h)+GRAVITY)<1e-8);
 assert(poseAt(RELEASE).lift>0);
 assert(poseAt(RELEASE).root[2]+5.8>6.75);
});
test('ball and body remain continuous through contacts and loop reset',()=>{
 for(const t of [1.4,1.75,RELEASE,SWISH,FLOOR_HIT,7,9.1,LOOP])assert(distance(ballAt(t-1e-6).position,ballAt(t+1e-6).position)<.001,`ball jump at ${t}`);
 for(let t=0;t<LOOP;t+=.002){const p=poseAt(t),b=ballAt(t);assert([...p.root,...p.left,...p.right,...b.position].every(Number.isFinite));assert(b.position[1]>=.1249);assert(distance(p.root,poseAt(t+.001).root)<.02);}
 assert(distance(poseAt(LOOP-1e-6).root,poseAt(0).root)<1e-4);
});
test('feet leave the ground during the jump and plant on landing',()=>{
 assert(poseAt(RELEASE).lift>.2);assert(!poseAt(RELEASE).leftContact);assert(!poseAt(RELEASE).rightContact);
 assert(poseAt(4.0).leftContact);assert(poseAt(4.0).rightContact);
 assert.equal(poseAt(2.4).phase,'STEPBACK');assert.equal(ballAt(4).mode,'SHOT');
});
