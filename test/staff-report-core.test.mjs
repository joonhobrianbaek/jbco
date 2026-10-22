import test from 'node:test';import assert from 'node:assert/strict';
import {createStaffReport,restoreStaffReports,staffReportWaitlist} from '../public/staff-report-core.js';
test('direct reports retain their actual author and content and are addressed to the CEO',()=>{
 const first=createStaffReport('gpt-research-support','자료 확인','실제로 받은 분석 결과'),second=createStaffReport('claude-writing','품의 검토','확인할 사항');const queue=staffReportWaitlist([first,second]);assert.deepEqual(queue.map(r=>r.employeeId),['gpt-research-support','claude-writing']);assert(queue.every(r=>r.owner&&r.direct));assert.equal(queue[0].result,'실제로 받은 분석 결과');assert.equal(queue[0].provider,'gpt');assert.equal(queue[1].provider,'claude');assert.deepEqual(staffReportWaitlist([]),[]);
});
test('empty, oversized, invalid and duplicate records cannot create report actors',()=>{
 assert.throws(()=>createStaffReport('unknown','제목','본문'));assert.throws(()=>createStaffReport('gpt-analysis',' ','본문'));assert.throws(()=>createStaffReport('gpt-analysis','제목',' '));assert.throws(()=>createStaffReport('gpt-analysis','제목','가'.repeat(12001)));
 const valid=createStaffReport('claude-writing','확인','실제 결과');assert.equal(restoreStaffReports([null,valid,valid,{...valid,id:'direct:other',employeeId:'missing'},{...valid,id:'direct:bad',createdAt:'bad'}]).length,1);
 assert.deepEqual(restoreStaffReports({}),[]);assert.equal(restoreStaffReports([{...valid,body:'<script>literal text</script>'}])[0].body,'<script>literal text</script>');
});
