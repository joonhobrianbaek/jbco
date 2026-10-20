const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
// One continuous ten-second possession, with the release beyond the arc.
export function stepbackState(time){
 const cycle=((Math.max(0,time)%10)+10)%10;
 const retreat=smooth((cycle-1.5)/.85);
 const recovery=smooth((cycle-5.3)/2.5);
 const x=cycle<2.35?7.2+2.4*retreat:9.6-2.4*recovery;
 return {cycle,x,z:8.3,shooting:cycle>=2.35&&cycle<3.75,jump:cycle>=2.35&&cycle<3.75?Math.sin((cycle-2.35)/1.4*Math.PI):0,ballPhase:cycle<1.5||cycle>=5.7?'dribble':cycle<3.05?'gather':cycle<4.55?'flight':'drop',flight:clamp((cycle-3.05)/1.5),drop:clamp((cycle-4.55)/1.15)};
}

// Staggered against the other shooters: a deep three at the opposite basket.
export function deepThreeState(time){
 const cycle=(Math.max(0,time)+4.2)%13;
 return {cycle,x:17.2,z:4.1,shooting:cycle>=1.8&&cycle<3.5,jump:cycle>=1.8&&cycle<3.5?Math.sin((cycle-1.8)/1.7*Math.PI):0,ballPhase:cycle<1.8||cycle>=5.6?'dribble':cycle<2.65?'gather':cycle<4.4?'flight':'drop',flight:clamp((cycle-2.65)/1.75),drop:clamp((cycle-4.4)/1.2)};
}
