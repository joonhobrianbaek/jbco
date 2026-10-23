import test from 'node:test';
import assert from 'node:assert/strict';
import {floorHeights,floorFootprints,stairs,liftedReportRoute,liftPosition,zoneFloor} from '../public/office-floors.js';
import {employees} from '../public/employees.js';
import {buildReportRoute,executiveOffice} from '../public/report-routes.js';
test('each employee reaches CEO through a single lift segment and returns to their origin',()=>{
 for(const e of employees){
  const home=e.standing||(e.lounge?[e.provider==='gpt'?-4.8:-2.8,4.75]:e.provider==='muse'?executiveOffice.chief:[e.desk[0]-.15,e.desk[1]-.75]);
  const route=liftedReportRoute(buildReportRoute(home,{owner:true,standing:!!e.standing,lounge:!!e.lounge}),{homeFloor:zoneFloor(...home),destinationFloor:2});
  assert.deepEqual(route[0],[home[0],1.08+floorHeights[zoneFloor(...home)],home[1]]);
  assert.deepEqual(route.at(-1),[6.85,9.88,-2.95]);
  const vertical=route.slice(1).map((p,i)=>[route[i],p]).filter(([a,b])=>a[1]!==b[1]);assert.equal(vertical.length,1);
  for(const [a,b]of vertical){assert.equal(a[0],liftPosition[0]);assert.equal(b[0],a[0]);assert.equal(a[2],liftPosition[1]);assert.equal(b[2],a[2]);}
  assert.deepEqual([...route].reverse().at(-1),route[0]);
 }
});
test('same-floor paths avoid the lift, invalid floors fail, downward route reaches ground',()=>{
 const source=[[6.85,-5.05],[4.35,-2.95],[-6,-2]];
 assert(liftedReportRoute(source,{homeFloor:1,destinationFloor:1}).every(p=>p[1]===5.48));
 const down=liftedReportRoute(source,{homeFloor:2,destinationFloor:0});assert.equal(down.at(-1)[1],1.08);
 assert.throws(()=>liftedReportRoute(source,{destinationFloor:3}));assert.throws(()=>liftedReportRoute([]));
});
test('floor widths are equal, depth shrinks and the left shaft is inside each floor',()=>{
 for(let i=0;i<3;i++){const f=floorFootprints[i];assert.equal(f.width,20.8);if(i)assert(f.depth<floorFootprints[i-1].depth);assert(stairs.left>=f.x-f.width/2);assert(stairs.right<f.x-f.width/2+2.1);assert(stairs.back>=f.z-f.depth/2);assert(stairs.front<f.z+f.depth/2);}
});
