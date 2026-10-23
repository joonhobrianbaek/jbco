/** Shared storeys and a two-flight staircase, with routes in world coordinates. */
export const floorHeights = [0,4.4,8.8];
export const liftPosition = [-9.3,-2.15];
export const stairs = {left:-10.2,right:-8.4,back:-3,front:-1.3}; // Shaft opening bounds.
export const floorFootprints = [{x:0,z:0,width:20.8,depth:12.6},{x:0,z:-.95,width:20.8,depth:10.6},{x:0,z:-2.15,width:20.8,depth:8.2}];
export function zoneFloor(x,z){return x>=4.3?(z< -1.4?2:1):0;}
/** Preserve desk approaches and use the left lift for vertical travel. */
export function liftedReportRoute(points,{homeFloor=0,destinationFloor=2}={}){
 if(![homeFloor,destinationFloor].every(n=>Number.isInteger(n)&&n>=0&&n<3)||points.length<2)throw new Error('잘못된 층 또는 경로');
 const y=1.08+floorHeights[homeFloor],dy=1.08+floorHeights[destinationFloor];
 if(homeFloor===destinationFloor)return points.map(([x,z])=>[x,y,z]);
 const crossing=points.findIndex(([x],i)=>i>0&&x>=4.3),split=crossing<0?points.length-1:crossing;
 const before=points.slice(0,split).map(([x,z])=>[x,y,z]),approach=homeFloor===0?3.9:1.6;
 return [...before,[3.65,y,approach],[-8.1,y,approach],[-8.1,y,-1],[-9.3,y,-1],[-9.3,y,-2.15],[-9.3,dy,-2.15],[-9.3,dy,-1],[-8.1,dy,-1],[-8.1,dy,1.6],[4.35,dy,1.6],[4.35,dy,points[split][1]],...points.slice(split).map(([x,z])=>[x,dy,z])].filter((p,i,a)=>!i||p.some((v,j)=>Math.abs(v-a[i-1][j])>1e-8));
}
