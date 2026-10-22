import * as T from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Small shared primitives and baked vertex colours keep the whole crew inexpensive.
const sphere=new T.SphereGeometry(1,16,12);
const cube=new T.BoxGeometry(1,1,1);
const material=new T.MeshLambertMaterial({vertexColors:true});
const palettes=[
 ['#f0c2a0','#25221f','#294355','#303c49'],
 ['#ebbd98','#453126','#e9debf','#46534a'],
 ['#d8a581','#29272a','#647b67','#394654'],
 ['#f4cbb4','#503b33','#b9a9cf','#494456'],
 ['#d7a584','#252a30','#769b9c','#37454e'],
 ['#edc7a5','#bd844b','#426b85','#384756'],
 ['#efc5a5','#6b432c','#d5bd91','#455047'],
 ['#c68e69','#27201e','#7e899c','#303b4d'],
 ['#eac0a4','#3c2824','#bd8c79','#424f48'],
 ['#f0cbb2','#302b2a','#839777','#424a53'],
];
function baker(){
 const parts=[];
 return {add(geometry,color,x,y,z,sx,sy,sz,rotation=0){
  const g=geometry.clone();g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),rotation),new T.Vector3(sx,sy,sz)));
  const c=new T.Color(color),colors=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(colors,3));parts.push(g);
 },mesh(){const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());return new T.Mesh(geometry,material);}};
}
export function createGameCrew({variant=1,owner=false,lounge=false}={}){
 const [skin,hair,shirt,trousers]=palettes[variant%palettes.length];
 const actor=new T.Group(),model=new T.Group();model.position.y=-1.08;actor.add(model);
 const body=baker();
 body.add(sphere,shirt,0,.99,0,.29,.36,.21);
 body.add(sphere,trousers,0,.68,0,.25,.13,.19);
 // Collar, jacket trim and a tiny badge distinguish premium outfits without logos.
 body.add(sphere,'#f5eee0',0,1.26,.08,.14,.07,.12);
 if(owner){body.add(cube,'#1c3349',-.12,1.07,.18,.07,.37,.045,-.25);body.add(cube,'#1c3349',.12,1.07,.18,.07,.37,.045,.25);body.add(cube,'#9b6861',0,1.14,.22,.045,.18,.02);}
 else if(variant<7){body.add(cube,'#d7bd7a',-.16,1.08,.19,.045,.04,.018);body.add(cube,'#e8e2d0',0,.97,.213,.015,.43,.015);}
 model.add(body.mesh());
 const head=new T.Group();head.position.y=1.57;model.add(head);
 const face=baker();face.add(sphere,skin,0,0,0,.39,.39,.34);
 for(const s of [-1,1]){face.add(sphere,skin,s*.38,-.035,0,.075,.10,.065);face.add(sphere,'#df9b88',s*.225,-.095,.285,.058,.028,.013);}
 face.add(sphere,skin,0,-.055,.337,.035,.037,.035);
 // Open cap leaves a broad forehead and an expressive face.
 const cap=new T.SphereGeometry(1,16,10,0,Math.PI*2,0,1.65);
 face.add(cap,hair,0,.09,-.025,.405,.34,.35);cap.dispose();
 const hairstyle=owner?0:variant%4;
 if(hairstyle===0){for(let i=0;i<4;i++)face.add(sphere,hair,-.24+i*.145,.24,.13,.13,.11,.19,-.25);}
 if(hairstyle===1){for(let i=0;i<6;i++)face.add(sphere,hair,-.29+i*.115,.23+(i%2)*.035,.20,.105,.10,.13,.3);}
 if(hairstyle===2){face.add(sphere,hair,-.18,.22,.22,.24,.13,.15,-.3);face.add(sphere,hair,.18,.26,.15,.20,.10,.17,.4);}
 if(hairstyle===3){face.add(sphere,hair,-.33,-.12,-.04,.10,.29,.23);face.add(sphere,hair,.33,-.12,-.04,.10,.29,.23);face.add(sphere,hair,.18,.4,-.10,.17,.15,.15);face.add(sphere,hair,-.16,.21,.23,.23,.10,.12,-.25);}
 for(const s of [-1,1])face.add(sphere,hair,s*.125,.065,.321,.06,.014,.013,s*.1);
 const smile=new T.TorusGeometry(.05,.009,5,12,Math.PI);face.add(smile,'#8b4e45',0,-.13,.32,1,1,1,Math.PI);smile.dispose();
 head.add(face.mesh());
 const eyeParts=baker();for(const s of [-1,1]){eyeParts.add(sphere,'#302b2b',s*.125,-.01,.324,.032,.047,.017);eyeParts.add(sphere,'#fff7ed',s*.125-.008,.008,.339,.009,.012,.005);}
 const eyes=eyeParts.mesh();head.add(eyes);
 if(variant===5){const glasses=baker();const ring=new T.TorusGeometry(.078,.009,5,16);for(const s of [-1,1])glasses.add(ring,'#3b352e',s*.125,-.008,.35,1,1,1);glasses.add(cube,'#3b352e',0,0,.35,.09,.012,.012);ring.dispose();head.add(glasses.mesh());}
 const seatedLegs=baker();for(const s of [-1,1]){seatedLegs.add(sphere,trousers,s*.145,.58,.15,.10,.10,.23);seatedLegs.add(sphere,trousers,s*.145,.35,.32,.085,.24,.085);seatedLegs.add(sphere,'#eee9dc',s*.145,.14,.37,.11,.07,.18);seatedLegs.add(cube,'#bbbcae',s*.145,.10,.39,.21,.035,.29);}
 const seated=seatedLegs.mesh();model.add(seated);
 const legs=[];for(const s of [-1,1]){const parts=baker();parts.add(sphere,trousers,0,-.23,0,.09,.25,.09);parts.add(sphere,'#eee9dc',0,-.46,.055,.11,.07,.17);const leg=new T.Group();leg.position.set(s*.14,.64,0);leg.add(parts.mesh());model.add(leg);legs.push(leg);}
 const hands=[];
 for(const s of [-1,1]){const parts=baker();parts.add(sphere,shirt,s*.08,.025,-.12,.105,.105,.25,s*-.1);parts.add(sphere,skin,0,0,.07,.085,.06,.10);const hand=new T.Group();hand.position.set(s*.23,1.015,.40);hand.add(parts.mesh());model.add(hand);hands.push(hand);}
 if(lounge){const pages=baker();pages.add(cube,'#f6f0dc',-.10,1.035,.49,.19,.025,.25,-.12);pages.add(cube,'#e6d9bd',.10,1.035,.49,.19,.025,.25,.12);model.add(pages.mesh());}
 let walking=false,standing=false;actor.userData.pose='seated';
 actor.userData.setWalking=value=>{walking=value;standing=value;actor.userData.pose=value?'walking':lounge?'reading':'typing';seated.visible=!value;legs.forEach(l=>l.visible=value);model.position.y=-1.08;};
 actor.userData.setStanding=()=>{actor.userData.setWalking(true);walking=false;actor.userData.pose='standing';};
 actor.userData.animate=(time,enabled)=>{
  const t=time*.001+variant*.71,active=enabled?1:0;
  head.rotation.z=active*Math.sin(t*1.6)*.025;
  eyes.scale.y=enabled&&Math.sin(t*1.7)>.985?.12:1;
  hands.forEach((hand,i)=>{hand.position.y=1.015+(standing?-.24:active*Math.sin(t*15+i*Math.PI)*.018);hand.position.z=standing?.04:.40;});
  legs.forEach((leg,i)=>leg.rotation.x=walking&&enabled?Math.sin(t*9+i*Math.PI)*.36:0);
 };
 actor.userData.setWalking(false);actor.userData.animate(0,false);
 return actor;
}
