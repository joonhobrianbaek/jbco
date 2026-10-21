import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import * as T from 'three';
const V=(x,y,z)=>new T.Vector3(x,y,z);
const material=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
function part(parent,geometry,mat,position,scale){const m=new T.Mesh(geometry,mat);m.position.set(...position);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const sphere=new T.SphereGeometry(1,28,20);
function oval(p,m,pos,size){return part(p,sphere,m,pos,size);}
function stroke(p,m,points,r=.008){return part(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>V(...a))),16,r,8,false),m,[0,0,0]);}
function limb(p,m,a,b,ra,rb){const av=V(...a),bv=V(...b);const mesh=part(p,new T.CylinderGeometry(rb,ra,av.distanceTo(bv),16),m,av.clone().add(bv).multiplyScalar(.5).toArray());mesh.quaternion.setFromUnitVectors(V(0,1,0),bv.sub(av).normalize());oval(p,m,a,[ra,ra,ra]);oval(p,m,b,[rb,rb,rb]);return mesh;}
let knit;
function knitMap(){if(knit)return knit;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#dddddd';x.fillRect(0,0,128,128);x.strokeStyle='#bcbcbc';x.lineWidth=1;for(let i=0;i<128;i+=8){for(let y=-8;y<128;y+=12){x.beginPath();x.moveTo(i,y);x.lineTo(i+3,y+5);x.lineTo(i,y+10);x.stroke();}}knit=new T.CanvasTexture(c);knit.wrapS=knit.wrapT=T.RepeatWrapping;knit.repeat.set(5,5);return knit;}
export function createSeatedStaff(parent,agent,index){
  const person=new T.Group();parent.add(person);person.position.set(0,.03,.84);const hands=[];
  const skin=material(['#c69a7b','#dfb89a','#af8b72','#d0a88a','#9b755f'][index],.65),hair=material(['#3b302b','#6a4735','#252e34','#493739','#30302e'][index],.78);
  const shirt=new T.MeshStandardMaterial({color:['#9cb9ad','#c4b49e','#8c9caa','#a397af','#9ca49c'][index],roughness:.92,bumpMap:agent.paid?knitMap():null,bumpScale:.008});
  const rib=material(['#8da99c','#b3a18b','#798d9f','#92809e','#89968a'][index]);const pants=material(index===2||index===4?'#465466':'#42484c'),shoe=material('#e6e2d8'),sole=material('#c8c6bb'),dark=material('#342e2b');
  // Adult seated proportions: pelvis rests on the chair; knees and soles meet the floor.
  oval(person,pants,[0,.605,-.025],[.175,.11,.16]);
  const torso=oval(person,shirt,[0,.88,-.025],[.205,.285,.135]);torso.rotation.x=-.11;
  oval(person,rib,[0,.658,-.015],[.18,.035,.135]);
  limb(person,skin,[0,1.095,-.052],[0,1.205,-.07],.052,.048);
  const collar=part(person,new T.TorusGeometry(.066,.013,10,28),rib,[0,1.115,-.05]);collar.rotation.x=Math.PI/2;
  for(const side of [-1,1]){
    limb(person,pants,[side*.095,.59,-.04],[side*.125,.51,-.37],.088,.075);
    limb(person,pants,[side*.125,.51,-.37],[side*.125,.135,-.38],.075,.052);
    oval(person,sole,[side*.125,.057,-.438],[.071,.031,.135]);oval(person,shoe,[side*.125,.092,-.441],[.068,.047,.13]);
    for(let k=0;k<3;k++)stroke(person,sole,[[side*.125-.035,.133,-.45+k*.022],[side*.125+.035,.133,-.45+k*.022]],.0028);
    oval(person,shirt,[side*.185,1.04,-.05],[.076,.10,.075]);
    limb(person,shirt,[side*.19,1.055,-.055],[side*.235,.895,-.29],.070,.053);
    limb(person,shirt,[side*.235,.895,-.29],[side*.16,.873,-.57],.054,.043);
    oval(person,rib,[side*.16,.873,-.56],[.046,.038,.035]);
    const hand=new T.Group();hand.position.set(side*.16,.875,-.615);person.add(hand);oval(hand,skin,[0,0,0],[.039,.019,.054]);
    for(let f=0;f<4;f++){const fx=-.025+f*.017;limb(hand,skin,[fx,0,-.025],[fx,-.002,-.080+(f===0||f===3?.012:0)],.0085,.0065);}
    limb(hand,skin,[side*.026,0,.005],[side*.052,-.002,-.026],.012,.008);hands.push({group:hand,baseY:hand.position.y,index:side});
    if(agent.paid&&side===-1){const strap=part(person,new T.CylinderGeometry(.046,.046,.026,20),dark,[-.16,.873,-.535]);strap.rotation.x=Math.PI/2;oval(person,material('#aaa798',.3),[-.16,.914,-.535],[.026,.008,.025]);}
  }
  const head=new T.Group();head.position.set(0,1.325,-.085);head.rotation.y=-.12;person.add(head);
  // Sculpted adult head, with a jaw/chin silhouette rather than a spherical baby face.
  const geo=new T.SphereGeometry(1,40,32),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const jaw=y<-.15?1-(Math.abs(y)-.15)*.22:1;x*=.123*jaw;z*=.108;if(z<0)z*=.9;z+=y<-.35?-.009:0;p.setXYZ(i,x,y*.165,z);}geo.computeVertexNormals();part(head,geo,skin,[0,0,0]);
  oval(head,skin,[0,-.114,-.045],[.075,.043,.060]);
  for(const side of [-1,1]){
    oval(head,skin,[side*.12,-.018,.005],[.022,.039,.018]);oval(head,material('#aa7a66'),[side*.132,-.019,-.003],[.008,.020,.007]);
    oval(head,material('#eee7db'),[side*.048,.012,-.095],[.025,.012,.009]);oval(head,material('#5b493a'),[side*.048,.011,-.104],[.009,.010,.0035]);oval(head,dark,[side*.048,.011,-.108],[.004,.006,.002]);
    stroke(head,hair,[[side*.025,.043,-.096],[side*.048,.049,-.099],[side*.074,.043,-.090]],.005);
    stroke(head,skin,[[side*.024,.026,-.096],[side*.049,.030,-.102],[side*.074,.023,-.091]],.004);
  }
  oval(head,skin,[0,-.007,-.112],[.018,.037,.017]);oval(head,skin,[0,-.028,-.132],[.021,.016,.017]);
  stroke(head,material('#936c60'),[[-.029,-.074,-.094],[0,-.078,-.107],[.029,-.072,-.094]],.0035);
  // Swept locks follow the skull. Fine strands catch the room light at close range.
  oval(head,hair,[0,.094,.023],[.128,.090,.100]);
  for(let k=0;k<11;k++){const x=-.11+k*.021;stroke(head,hair,[[x,.075,.079],[x*.9,.174,.016],[x*.72+.025,.146,-.083],[x*.8+.018,.080,-.096]],.018);}
  const strand=material(index===1?'#806049':'#4b403a');
  for(let k=0;k<10;k++){const x=-.10+k*.021;stroke(head,strand,[[x,.123,.05],[x*.85,.178,.004],[x*.72+.02,.144,-.075]],.0024);}
  for(const side of [-1,1])oval(head,hair,[side*.107,.022,.023],[.025,.065,.060]);
  if(agent.id==='muse'){oval(head,hair,[.025,.057,.115],[.095,.10,.07]);oval(head,hair,[.035,.135,.14],[.061,.061,.057]);}
  compact(person);
  return {person,head,hands,index,paid:!!agent.paid,baseHeadY:head.rotation.y};
}
export function animateSeatedStaff(worker,time){const t=time+worker.index*1.6;worker.head.rotation.y=worker.baseHeadY+Math.sin(t*.32)*.028;worker.head.rotation.x=Math.sin(t*.44)*.012;for(const h of worker.hands)h.group.position.y=h.baseY+Math.max(0,Math.sin(t*4+h.index))* .0025;}

function compact(group){for(const child of [...group.children])if(child.isGroup)compact(child);const batches=new Map();for(const child of group.children){if(!child.isMesh)continue;const list=batches.get(child.material)||[];list.push(child);batches.set(child.material,list);}for(const [mat,objects] of batches){if(objects.length<2)continue;const geometries=objects.map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix);});const geometry=mergeGeometries(geometries,false);if(geometry){const merged=new T.Mesh(geometry,mat);merged.castShadow=merged.receiveShadow=true;group.add(merged);objects.forEach(o=>group.remove(o));}geometries.forEach(g=>g.dispose());}}
