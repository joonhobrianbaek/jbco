/** Shared storeys and a two-flight staircase, with routes in world coordinates. */
export const floorHeights = [0,4.4,8.8];
export const liftPosition = [3.65,-2.95]; // Retained for older integrations; no lift movement.
export const stairs = {left:2.5,right:4.25,back:-1.8,front:2.95,lowerX:2.9,upperX:3.85,steps:12,startZ:2.7,endZ:-1.3,width:.78};
export const floorFootprints = [{x:0,z:0,width:20.8,depth:12.6},{x:1.8,z:-.1,width:17,depth:12.4},{x:3.9,z:-.7,width:12.8,depth:11}];
export function zoneFloor(x,z){return x>=4.3?(z< -1.4?2:1):0;}
/** Walk one storey using both flights and a half-height landing. */
export function stairFlight(floor){
 if(!Number.isInteger(floor)||floor<0||floor>1)throw new Error('잘못된 계단 층');
 const s=stairs,y=floorHeights[floor]+1.08,points=[[s.lowerX,y,s.startZ]];
 for(let i=1;i<=s.steps;i++)points.push([s.lowerX,y+2.2*i/s.steps,s.startZ+(s.endZ-s.startZ)*i/s.steps]);
 points.push([s.upperX,y+2.2,s.endZ]);
 for(let i=1;i<=s.steps;i++)points.push([s.upperX,y+2.2+2.2*i/s.steps,s.endZ+(s.startZ-s.endZ)*i/s.steps]);
 return points;
}
/** Preserve desk approaches; climb the physical stairs instead of moving vertically. */
export function liftedReportRoute(points,{homeFloor=0,destinationFloor=2}={}){
 if(![homeFloor,destinationFloor].every(n=>Number.isInteger(n)&&n>=0&&n<3)||points.length<2)throw new Error('잘못된 층 또는 경로');
 const height=floorHeights[homeFloor]+1.08;
 if(homeFloor===destinationFloor)return points.map(([x,z])=>[x,height,z]);
 const crossing=points.findIndex(([x],i)=>i>0&&x>=4.3),split=crossing<0?points.length-1:crossing;
 const before=points.slice(0,split).map(([x,z])=>[x===3.65?2.3:x,height,z]);
 const path=[...before];
 if(homeFloor<destinationFloor){
  path.push([2.3,height,stairs.front],[stairs.lowerX,height,stairs.front]);
  for(let f=homeFloor;f<destinationFloor;f++){
   if(f>homeFloor)path.push([stairs.upperX,floorHeights[f]+1.08,stairs.front],[stairs.lowerX,floorHeights[f]+1.08,stairs.front]);
   path.push(...stairFlight(f));
  }
 }else{
  path.push([4.4,height,stairs.front],[stairs.upperX,height,stairs.front]);
  for(let f=homeFloor-1;f>=destinationFloor;f--){
   if(f<homeFloor-1)path.push([stairs.lowerX,floorHeights[f+1]+1.08,stairs.front],[stairs.upperX,floorHeights[f+1]+1.08,stairs.front]);
   path.push(...stairFlight(f).reverse());
  }
 }
 const destHeight=floorHeights[destinationFloor]+1.08;
 path.push([4.35,destHeight,stairs.front],[4.35,destHeight,points[split][1]],...points.slice(split).map(([x,z])=>[x,destHeight,z]));
 return path.filter((p,i,a)=>!i||p.some((v,j)=>Math.abs(v-a[i-1][j])>1e-8));
}
