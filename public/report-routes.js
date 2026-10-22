// Coordinates shared by the room, reporting staff and route checks.
export const executiveOffice={
 bounds:{left:4.4,right:10,back:-6.1,front:-1.4},
 desk:[7,-4.3],owner:[6.85,-5.05],entrance:[4.4,-2.95],
 report:[6.85,-2.95],chief:[6.85,-.8],chiefReport:[6.85,1.05],aisleX:3.65
};
export function buildReportRoute(home,{owner=false,lounge=false}={}){
 const [x,z]=home,room=executiveOffice,points=[[x,z]];
 if(lounge){const exit=x<-4?-6.65:-.9;points.push([exit,z],[exit,3.1],[room.aisleX,3.1]);}
 else{const aisleZ=x>room.bounds.left?z-.2:z-.65;points.push([x,aisleZ],[room.aisleX,aisleZ]);}
 if(owner)points.push([room.aisleX,room.entrance[1]],room.entrance,room.report);
 else points.push([room.aisleX,room.chiefReport[1]],room.chiefReport);
 return points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]).map(p=>[...p]);
}
