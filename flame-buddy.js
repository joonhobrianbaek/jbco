import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
// Rigid-part articulation, not a skinned rig or a motion-capture animation.
export async function loadFlameBuddy(){
 const gltf=await new GLTFLoader().loadAsync('./assets/crew/flame-buddy-seated.glb');
 const object=gltf.scene,body=object.getObjectByName('BuddyBodyRoot');
 const legs=['Left','Right'].map(side=>({thigh:object.getObjectByName('Buddy'+side+'Thigh'),shin:object.getObjectByName('Buddy'+side+'Shin')}));
 if(!body||legs.some(l=>!l.thigh||!l.shin))throw Error('캐릭터 자세 노드를 찾지 못했습니다.');
 const baseline={bodyY:body.position.y,legs:legs.map(l=>({y:l.thigh.position.y,thigh:l.thigh.rotation.x,shin:l.shin.rotation.x}))};let standing=false;
 let triangles=0;object.traverse(mesh=>{if(!mesh.isMesh)return;triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;mesh.castShadow=false;mesh.receiveShadow=false;for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){material.metalness=0;if(material.normalScale)material.normalScale.set(.35,.35);material.roughness=Math.max(.7,material.roughness);for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(material[key])material[key].anisotropy=1;}});
 function pose(isStanding){standing=isStanding;body.position.y=baseline.bodyY+(standing?.24:0);for(const [i,l]of legs.entries()){l.thigh.position.y=baseline.legs[i].y+(standing?.24:0);l.thigh.rotation.x=baseline.legs[i].thigh+(standing?Math.PI/2:0);l.shin.rotation.x=baseline.legs[i].shin-(standing?Math.PI/2:0);}}
 function gait(time){if(!standing)return;for(const [i,l]of legs.entries()){const wave=Math.sin(time*10+i*Math.PI);l.thigh.rotation.x=baseline.legs[i].thigh+Math.PI/2+wave*.22;l.shin.rotation.x=baseline.legs[i].shin-Math.PI/2-Math.max(0,wave)*.22;}body.position.y=baseline.bodyY+.24+Math.abs(Math.sin(time*10))*.012;}
 pose(false);return {object,pose,gait,diagnostics:()=>({triangles:Math.round(triangles),standing,source:'user-supplied-flame-buddy',skins:gltf.parser.json.skins?.length||0,animations:gltf.animations.length})};
}
