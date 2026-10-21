import test from 'node:test';
import assert from 'node:assert/strict';
import {employees,teamEmployees,meetingRepresentative,employeeTaskCount} from '../public/employees.js';
test('paid main departments have distinct roles and free teams remain one actual employee',()=>{
 assert.equal(new Set(employees.map(e=>e.id)).size,9);
 for(const id of ['gpt','claude']){const team=teamEmployees(id);assert.equal(team.length,3);assert.equal(new Set(team.map(e=>e.role)).size,3);assert.equal(new Set(team.map(e=>e.model)).size,3);}
 for(const id of ['gemini','copilot','muse'])assert.equal(teamEmployees(id).length,1);
 assert.equal(teamEmployees('muse')[0].role,'비서실장');assert.equal(teamEmployees('muse')[0].privateOffice,true);
 assert.equal(employees.filter(e=>e.lounge).length,2);
});
test('old department tasks count once while employee assignments stay with their own provider',()=>{
 const representative=meetingRepresentative('gpt'),colleague=teamEmployees('gpt')[1];
 const tasks=[{agent:'gpt'},{agent:'gpt',employeeId:colleague.id},{agent:'claude',employeeId:colleague.id}];
 assert.equal(employeeTaskCount(representative,tasks),1);assert.equal(employeeTaskCount(colleague,tasks),1);
 assert.equal(teamEmployees('gpt').reduce((n,e)=>n+employeeTaskCount(e,tasks),0),2);
 assert.equal(meetingRepresentative('gemini').id,teamEmployees('gemini')[0].id);
});
