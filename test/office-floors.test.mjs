import test from 'node:test';
import assert from 'node:assert/strict';
import {floorHeights,floorFootprints,zoneFloor,liftedReportRoute,liftPosition} from '../public/office-floors.js';
import {employees} from '../public/employees.js';
import {buildReportRoute,executiveOffice} from '../public/report-routes.js';
test('every employee reaches the third-floor CEO through one vertical lift segment and can return home',()=>{
 for(const e of employees){
  const home=e.standing||(e.lounge?[e.provider==='gpt'?-4.8:-2.8,4.75]:e.provider==='muse'?executiveOffice.chief:[e.desk[0]-.15,e.desk[1]-.75]);
  const source=buildReportRoute(home,{owner:true,standing:!!e.standing,lounge:!!e.lounge});
  const points=liftedReportRoute(source,{homeFloor:zoneFloor(...home),destinationFloor:2});
  assert.deepEqual(points[0],[home[0],1.08+floorHeights[zoneFloor(...home)],home[1]]);
  assert.deepEqual(points.at(-1),[6.85,9.88,-2.95]);
  const vertical=points.slice(1).map((p,i)=>[points[i],p]).filter(([a,b])=>a[1]!==b[1]);
  assert.equal(vertical.length,1);
  for(const [a,b] of vertical){assert.equal(a[0],liftPosition[0]);assert.equal(b[0],a[0]);assert.equal(a[2],liftPosition[1]);assert.equal(b[2],a[2]);}
  assert.deepEqual([...points].reverse().at(-1),points[0]);
 }
});
test('chief is on floor two; same-floor paths do not use a lift; invalid floors fail',()=>{
 const source=buildReportRoute([-6.15,-2.55]);
 const points=liftedReportRoute(source,{destinationFloor:1});assert.deepEqual(points.at(-1),[6.85,5.48,1.05]);
 const same=liftedReportRoute(source,{homeFloor:1,destinationFloor:1});assert(same.every(p=>p[1]===5.48));
 assert.throws(()=>liftedReportRoute(source,{destinationFloor:3}));assert.throws(()=>liftedReportRoute([]));
});

test('upper floor footprints are nested and shrink; lift and CEO suite remain supported',()=>{
 for(let i=1;i<3;i++){
  const a=floorFootprints[i-1],b=floorFootprints[i];
  assert(b.width<a.width);assert(b.depth<a.depth);
  assert(b.x-b.width/2>=a.x-a.width/2-1e-9);assert(b.x+b.width/2<=a.x+a.width/2+1e-9);
  assert(b.z-b.depth/2>=a.z-a.depth/2-1e-9);assert(b.z+b.depth/2<=a.z+a.depth/2+1e-9);
  for(const [x,z] of [liftPosition,executiveOffice.owner,executiveOffice.report]){assert(x>b.x-b.width/2&&x<b.x+b.width/2);assert(z>b.z-b.depth/2&&z<b.z+b.depth/2);}
 }
});
