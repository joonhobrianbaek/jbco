/** Shared elevations and lift routes for the three-storey cutaway office. */
export const floorHeights = [0, 4.4, 8.8];
export const liftPosition = [3.65, -2.95];
export function zoneFloor(x,z) {return x >= 4.3 ? (z < -1.4 ? 2 : 1) : 0;}
/** Preserve the existing desk aisle, then use the same lift on both storeys. */
export function liftedReportRoute(points,{homeFloor=0,destinationFloor=2}={}) {
 if (![homeFloor,destinationFloor].every(n=>Number.isInteger(n)&&n>=0&&n<3)) throw new Error('잘못된 층');
 if(points.length<2)throw new Error('보고 경로가 필요합니다.');
 if(homeFloor===destinationFloor)return points.map(([x,z])=>[x,1.08+floorHeights[homeFloor],z]);
 const crossing=points.findIndex(([x],i)=>i>0&&x>=4.3);
 const split=crossing<0?points.length-1:crossing;
 const before=points.slice(0,split).map(([x,z])=>[x,1.08+floorHeights[homeFloor],z]);
 const after=points.slice(split).map(([x,z])=>[x,1.08+floorHeights[destinationFloor],z]);
 return [...before,[liftPosition[0],1.08+floorHeights[homeFloor],liftPosition[1]],[liftPosition[0],1.08+floorHeights[destinationFloor],liftPosition[1]],...after].filter((p,i,a)=>!i||p.some((v,j)=>v!==a[i-1][j]));
}
