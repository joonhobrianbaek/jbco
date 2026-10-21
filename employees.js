// Provider IDs remain stable for saved tasks, projects and meeting records.
export const employees=[
 {id:'gpt-analysis',provider:'gpt',role:'분석·리서치',model:'gpt',projectId:'closing',desk:[-6,-1.8]},
 {id:'gpt-planning',provider:'gpt',role:'기획·청구',model:'gemini',projectId:'spot-billing',desk:[-6,1.65]},
 {id:'gpt-creative',provider:'gpt',role:'아이디어·콘텐츠',model:'muse',lounge:'conversation'},
 {id:'claude-writing',provider:'claude',role:'품의·문서',model:'claude',projectId:'proposal',desk:[-2.4,-1.8]},
 {id:'claude-operations',provider:'claude',role:'운영·근태',model:'gpt',projectId:'labor-cost',desk:[-2.4,1.65]},
 {id:'claude-review',provider:'claude',role:'정산·검토',model:'copilot',projectId:'closing',lounge:'reading'},
 {id:'gemini-research',provider:'gemini',role:'자료 조사',model:'gemini',desk:[.9,-1.8]},
 {id:'muse-video',provider:'muse',role:'비서실장',model:'muse',desk:[12.2,.25],privateOffice:true},
 {id:'copilot-development',provider:'copilot',role:'개발 지원',model:'copilot',projectId:'automation-project',desk:[.9,1.65]},
];
export const teamEmployees=id=>employees.filter(e=>e.provider===id);
export const meetingRepresentative=id=>teamEmployees(id).find(e=>e.desk)||null;
export function employeeTaskCount(employee,tasks){return tasks.filter(t=>t.agent===employee.provider&&(t.employeeId?t.employeeId===employee.id:meetingRepresentative(employee.provider)?.id===employee.id)).length;}
