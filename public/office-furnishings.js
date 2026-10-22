import * as T from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Static architectural detail is batched by material, rather than adding a draw
// call for every book, cup or cabinet handle. No shadow maps or extra lights.
export function furnishOffice(scene,woodTexture){
 const batches=new Map(),cube=new T.BoxGeometry(1,1,1),ball=new T.SphereGeometry(1,12,8),cylinder=new T.CylinderGeometry(1,1,1,16);
 function part(shape,color,x,y,z,w,h,d){const g=shape.clone();g.scale(w,h,d);g.translate(x,y,z);if(!batches.has(color))batches.set(color,[]);batches.get(color).push(g);}
 const box=(color,x,y,z,w,h,d)=>part(cube,color,x,y,z,w,h,d);
 const oval=(color,x,y,z,w,h,d)=>part(ball,color,x,y,z,w,h,d);
 const cup=(x,y,z)=>{part(cylinder,'#e8e2cf',x,y,z,.07,.14,.07);part(cylinder,'#67523b',x,y+.071,z,.055,.004,.055);};
 // The original office's pantry: open oak shelving, dark uprights and ceramics.
 for(const x of [-6.35,-2.1,2.15])box('#405246',x,1.46,-5.91,.035,2.8,.035);
 for(const y of [1.78,2.34])box('wood',-2.1,y,-5.73,8.7,.065,.40);
 for(let i=0;i<8;i++)box('#65705b',-6.05+i*1.04,.54,-5.19,.014,.83,.018);
 for(let i=0;i<13;i++)box(['#b3bba1','#dad2bb','#8ca693'][i%3],-5.8+i*.47,2.02,-5.73,.10+(i%3)*.025,.38,.22);
 for(const x of [.9,1.2,1.5])cup(x,1.89,-5.69);
 box('#536154',-4.8,1.38,-5.28,.40,.24,.025);box('#c8c7b7',-4.8,1.16,-5.22,.44,.035,.23);cup(-4.8,1.24,-5.24);
 part(cylinder,'#657267',-.45,1.17,-5.58,.24,.015,.19);box('#657267',-.45,1.33,-5.76,.025,.32,.025);box('#657267',-.45,1.48,-5.65,.025,.025,.23);
 // Reception cabinetry and a reading lamp bring back the furnished studio feel.
 box('wood',-8.25,.55,4.75,2.15,1.02,.78);box('#ede7d8',-8.25,1.10,4.75,2.25,.08,.86);
 for(const x of [-8.8,-8.25,-7.7])box('#65705b',x,.55,5.15,.014,.82,.018);
 part(cylinder,'#405246',-1.05,.08,5.35,.28,.06,.28);box('#405246',-1.05,1.13,5.35,.025,2.1,.025);
 const shade=new T.CylinderGeometry(.25,.43,.43,16);part(shade,'#e4dcc2',-1.05,2.1,5.35,1,1,1);shade.dispose();
 for(const [x,z,color]of [[-8.6,.2,'#cda280'],[-8.6,1.7,'#a2bdb0']]){oval(color,x,.25,z,.48,.24,.48);oval(color,x,.46,z+.20,.43,.29,.24);}
 // Rounded cushions, a notebook and coffee cups give the lounge some texture.
 for(const x of [-5.1,-3.8,-2.5])box('#c4b6d1',x,.83,4.68,1.22,.12,.86);
 oval('#ddd5b9',-5.4,1.02,5.10,.28,.25,.10);oval('#8ba99b',-2.25,1.02,5.10,.28,.25,.10);
 box('#ece5d5',-3.8,.54,3.5,.36,.035,.43);cup(-4.35,.59,3.5);cup(-3.25,.59,3.45);
 for(const [color,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());const material=new T.MeshLambertMaterial(color==='wood'?{map:woodTexture}:{color});scene.add(new T.Mesh(geometry,material));}
 cube.dispose();ball.dispose();cylinder.dispose();
 // Shared soft contact texture gives depth while keeping GPU shadows disabled.
 const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(32,32,3,32,32,32);gradient.addColorStop(0,'#203124');gradient.addColorStop(1,'#20312400');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const texture=new T.CanvasTexture(c),shadow=new T.MeshBasicMaterial({map:texture,transparent:true,opacity:.16,depthWrite:false});
 for(const [x,z,w,d]of [[-6,-1.8,3.2,2.1],[-6,1.65,3.2,2.1],[-2.4,-1.8,3.2,2.1],[-2.4,1.65,3.2,2.1],[.9,-1.8,3.2,2.1],[.9,1.65,3.2,2.1],[-3.8,4.8,5.2,2.0],[7,-4.3,4.5,2.3],[7,4,4.8,2.4]]){const plane=new T.Mesh(new T.PlaneGeometry(w,d),shadow);plane.rotation.x=-Math.PI/2;plane.position.set(x,.14,z);scene.add(plane);}
}
