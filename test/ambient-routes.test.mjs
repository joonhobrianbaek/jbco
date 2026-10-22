import test from 'node:test';
import assert from 'node:assert/strict';
import {ambientRoute,roamingStaff} from '../public/ambient-routes.js';
import {employees} from '../public/employees.js';
function crosses(a,b,[left,right,back,front]){return a[0]===b[0]?a[0]>left&&a[0]<right&&Math.max(a[1],b[1])>back&&Math.min(a[1],b[1])<front:a[1]>back&&a[1]<front&&Math.max(a[0],b[0])>left&&Math.min(a[0],b[0])<right;}
test('three support employees walk through aisles without crossing desks, the lounge table or room glass',()=>{
 assert.equal(new Set(roamingStaff).size,3);
 const obstacles=employees.filter(e=>e.desk&&e.provider!=='muse').map(e=>[e.desk[0]-1.3-.12,e.desk[0]+1.3+.12,e.desk[1]-.56-.12,e.desk[1]+.56+.12]);obstacles.push([-4.82,-2.78,2.90,4.10],[4.2,4.5,-6.1,-3.7],[4.2,4.5,-2.4,-1.4],[4.2,4.5,3.5,6],[9.5,9.8,1.8,6],[-6.6,2.4,-6,-5]);
 for(const id of roamingStaff){const e=employees.find(e=>e.id===id),home=e.standing,route=ambientRoute(id,home);assert.deepEqual(route.points[0],home);assert(route.place);assert(route.lookAt.every(Number.isFinite));for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];assert(a[0]===b[0]||a[1]===b[1]);for(const obstacle of obstacles)assert(!crosses(a,b,obstacle),id+' crosses furniture');}assert.deepEqual([...route.points].reverse().at(-1),home);}
});
