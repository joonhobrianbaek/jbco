import test from 'node:test';import assert from 'node:assert/strict';
import {armDimensions as d,crewArmPose} from '../public/crew-arm-pose.js';
function hand(p){return {y:d.shoulderY-d.upper*Math.cos(p.shoulderX)-d.forearm*Math.cos(p.shoulderX+p.elbowX),z:-d.upper*Math.sin(p.shoulderX)-d.forearm*Math.sin(p.shoulderX+p.elbowX)};}
test('standing hands rest beside the hips instead of projecting horizontally',()=>{
 for(let index=0;index<2;index++){const p=crewArmPose({standing:true,index}),h=hand(p);assert(h.y>.65&&h.y<.85);assert(Math.abs(h.z)<.08);assert(Math.abs(p.shoulderZ)<.1);}
});
test('seated hands reach keyboard height and walking arms swing opposite their legs',()=>{
 for(let i=0;i<100;i++){const phase=i*.05;for(let index=0;index<2;index++){let p=crewArmPose({phase,index,active:true}),h=hand(p);assert(h.y>.98&&h.y<1.04);assert(h.z>.35&&h.z<.43);p=crewArmPose({standing:true,walking:true,phase,index,active:true});h=hand(p);assert(h.y>.65&&h.y<.85);assert(Math.abs(h.z)<.21);assert((p.shoulderX-.04)*Math.sin(phase*9+index*Math.PI)<=.000001);}}
 const paused=crewArmPose({standing:true,walking:true,active:false});assert.deepEqual(paused,crewArmPose({standing:true}));
});
