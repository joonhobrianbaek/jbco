// Radians around a shoulder pivot and a connected elbow. Arms start pointing down.
export const armDimensions={shoulderY:1.20,upper:.24,forearm:.23};
export function crewArmPose({standing=false,walking=false,phase=0,index=0,active=false}={}){
 const side=index===0?-1:1;
 if(standing)return {shoulderX:.04-(walking&&active?Math.sin(phase*9+index*Math.PI)*.28:0),shoulderZ:side*.05,elbowX:.12};
 return {shoulderX:-.7,shoulderZ:0,elbowX:-.85+(active?Math.sin(phase*15+index*Math.PI)*.025:0)};
}
