// Provider IDs remain stable for saved tasks, projects and meeting records.
export const employees=[
 {id:'gpt-analysis',provider:'gpt',role:'분석·리서치',avatar:'gpt',projectId:'closing',desk:[-6,-1.8]},
 {id:'gpt-planning',provider:'gpt',role:'기획·청구',avatar:'gemini',projectId:'spot-billing',desk:[-6,1.65]},
 {id:'gpt-creative',provider:'gpt',role:'아이디어·콘텐츠',avatar:'muse',lounge:'conversation'},
 {id:'claude-writing',provider:'claude',role:'품의·문서',avatar:'claude',projectId:'proposal',desk:[-2.4,-1.8]},
 {id:'claude-operations',provider:'claude',role:'운영·근태',avatar:'gpt',projectId:'labor-cost',desk:[-2.4,1.65]},
 {id:'claude-review',provider:'claude',role:'정산·검토',avatar:'copilot',projectId:'closing',lounge:'reading'},
 {id:'gemini-research',provider:'gemini',role:'자료 조사',avatar:'gemini',desk:[.9,-1.8]},
 {id:'muse-video',provider:'muse',role:'비서실장',avatar:'muse',desk:[12.2,.25],privateOffice:true},
 {id:'copilot-development',provider:'copilot',role:'개발 지원',avatar:'copilot',projectId:'automation-project',desk:[.9,1.65]},
 {id:'gpt-research-support',provider:'gpt',role:'자료정리 지원',avatar:'gpt',projectId:'closing',standing:[2.9,-4.5],station:'커피 코너'},
 {id:'gpt-planning-support',provider:'gpt',role:'기획 지원',avatar:'muse',standing:[-.75,3.1],station:'라운지 앞'},
 {id:'claude-document-support',provider:'claude',role:'문서 지원',avatar:'claude',projectId:'proposal',standing:[3.15,2.9],station:'회의실 앞'},
];
export const teamEmployees=id=>employees.filter(e=>e.provider===id);
export const meetingRepresentative=id=>teamEmployees(id).find(e=>e.desk)||null;
export function employeeTaskCount(employee,tasks){return tasks.filter(t=>t.agent===employee.provider&&(t.employeeId?t.employeeId===employee.id:meetingRepresentative(employee.provider)?.id===employee.id)).length;}

// Provider is the stable department identity; executor is independently configurable.
for(const employee of employees){employee.executor=employee.provider==='claude'?'claude-code':employee.provider==='gpt'?'codex':'manual';}
export const apiEmployees=employees.filter(e=>!e.standing&&['codex','claude-code'].includes(e.executor));
