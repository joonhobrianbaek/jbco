import test from 'node:test';
import assert from 'node:assert/strict';
import {employees} from '../public/employees.js';
import {buildReportRoute,executiveOffice as room} from '../public/report-routes.js';
function crosses(a,b,rect){const [left,right,back,front]=rect;return a[0]===b[0]?a[0]>left&&a[0]<right&&Math.max(a[1],b[1])>back&&Math.min(a[1],b[1])<front:a[1]>back&&a[1]<front&&Math.max(a[0],b[0])>left&&Math.min(a[0],b[0])<right;}
test('every seated or standing employee enters the executive doorway and stops in front of the CEO desk',()=>{
 for(const e of employees){
  const home=e.standing|| (e.lounge?[e.provider==='gpt'?-4.8:-2.8,4.75]:e.provider==='muse'?room.chief:[e.desk[0]-.15,e.desk[1]-.75]);
  const points=buildReportRoute(home,{owner:true,standing:!!e.standing,lounge:!!e.lounge});assert.deepEqual(points[0],home);assert.deepEqual(points.at(-1),room.report);assert(points.some(p=>p[0]===room.entrance[0]&&p[1]===room.entrance[1]));
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];assert(a[0]===b[0]||a[1]===b[1]);
   assert(!crosses(a,b,[-4.7,-2.9,2.575,3.525]),'must not walk through lounge coffee table');
   assert(!crosses(a,b,[5.3,8.7,-4.99,-3.61]),'must not walk through CEO desk');
   assert(!crosses(a,b,[5.6,8.4,-.71,.61]),'must not walk through secretary desk');
   // The two glass segments leave one doorway; never pass through either pane.
   if(Math.min(a[0],b[0])<room.bounds.left&&Math.max(a[0],b[0])>room.bounds.left&&a[1]<room.bounds.front)assert(a[1]>=-3.7&&a[1]<=-2.4);
  }
 }
});
test('chief handoffs and CEO reports end at separate recipients and return along the same clear path',()=>{
 const home=[-6.15,-2.55],chief=buildReportRoute(home),ceo=buildReportRoute(home,{owner:true});assert.deepEqual(chief.at(-1),room.chiefReport);assert.notDeepEqual(chief.at(-1),ceo.at(-1));assert.deepEqual([...ceo].reverse().at(-1),home);
});
