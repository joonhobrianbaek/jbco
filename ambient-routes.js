// Visual office routines only. They never create tasks, results or API requests.
export const roamingStaff=['gpt-research-support','claude-document-support','gpt-planning-support'];
export function ambientRoute(id,home){
 const [x,z]=home;
 if(id==='gpt-research-support')return {place:'중앙 통로',lookAt:[-2.4,-1.8],points:[[x,z],[x,-3.2],[3.15,-3.2],[3.15,-.1]]};
 if(id==='claude-document-support')return {place:'업무석 사이',lookAt:[-2.4,1.65],points:[[x,z],[x,.15],[-.75,.15],[-.75,1.9]]};
 if(id==='gpt-planning-support')return {place:'커피 코너',lookAt:[1.5,-5.55],points:[[x,z],[x,.25],[2.9,.25],[2.9,-3.7]]};
 throw new Error('Unknown roaming employee');
}
