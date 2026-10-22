import {employees} from './employees.js?v=2';
export const staffReportKey='jbco-staff-reports';
export function restoreStaffReports(value){
 if(!Array.isArray(value))return [];
 const seen=new Set();return value.filter(r=>{
  if(!r||typeof r.id!=='string'||!/^direct:[a-zA-Z0-9-]{1,80}$/.test(r.id)||seen.has(r.id)||!employees.some(e=>e.id===r.employeeId)||typeof r.title!=='string'||!r.title.trim()||r.title.length>160||typeof r.body!=='string'||!r.body.trim()||r.body.length>12000||typeof r.createdAt!=='string'||!Number.isFinite(Date.parse(r.createdAt)))return false;
  seen.add(r.id);return true;
 }).slice(0,100).map(r=>({id:r.id,employeeId:r.employeeId,title:r.title,body:r.body,createdAt:r.createdAt}));
}
export function createStaffReport(employeeId,title,body){
 if(!employees.some(e=>e.id===employeeId))throw Error('보고할 직원을 선택해주세요.');
 if(!title.trim()||title.trim().length>160)throw Error('보고 제목을 1~160자로 작성해주세요.');
 if(!body.trim()||body.trim().length>12000)throw Error('실제 결과나 확인할 내용을 1~12,000자로 작성해주세요.');
 return {id:'direct:'+crypto.randomUUID(),employeeId,title:title.trim(),body:body.trim(),createdAt:new Date().toISOString()};
}
export function staffReportWaitlist(value){return restoreStaffReports(value).map(r=>{const e=employees.find(e=>e.id===r.employeeId);return {id:r.id,goal:r.title,role:e.role,result:r.body,provider:e.provider,employeeId:e.id,owner:true,direct:true};});}
