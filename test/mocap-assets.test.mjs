import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=readFileSync(new URL('../public/assets/player-mocap.glb',import.meta.url));
const jsonLength=data.readUInt32LE(12),asset=JSON.parse(data.subarray(20,20+jsonLength).toString()),bin=data.subarray(28+jsonLength);
function floats(index){const a=asset.accessors[index],v=asset.bufferViews[a.bufferView],count={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],offset=(v.byteOffset||0)+(a.byteOffset||0);assert.equal(a.componentType,5126);return Array.from({length:a.count*count},(_,i)=>bin.readFloatLE(offset+i*4));}
test('runtime asset is a bounded GLB with actual skin weights and two recorded clips',()=>{
 assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);assert(data.length<8*1024*1024);
 assert.equal(asset.skins.length,1);assert.equal(asset.skins[0].joints.length,80);
 assert.deepEqual(asset.animations.map(a=>a.name).sort(),['CMU_06_15_Dribble_Shoot','CMU_124_03_Basketball_Shoot'].sort());
 for(const primitive of asset.meshes[0].primitives){assert('JOINTS_0'in primitive.attributes);const weights=floats(primitive.attributes.WEIGHTS_0);for(let i=0;i<weights.length;i+=4)assert(Math.abs(weights.slice(i,i+4).reduce((a,b)=>a+b,0)-1)<.005);}
});
test('recorded clips contain varying limb rotations at the exported 60fps',()=>{
 for(const animation of asset.animations){const rotations=animation.channels.filter(c=>c.target.path==='rotation'&&/Forearm/.test(asset.nodes[c.target.node].name));assert(rotations.length>=2);const sampler=animation.samplers[rotations[0].sampler],times=floats(sampler.input),values=floats(sampler.output);assert(times.length>200);assert(Math.abs(times[1]-times[0]-1/60)<1e-4);const first=values.slice(0,4);assert(values.some((x,i)=>Math.abs(x-first[i%4])>.02),'captured limb must move');}
});
test('web textures are local PNGs capped at 1024px and credits retain usage terms',()=>{
 assert.equal(asset.images.length,4);for(const img of asset.images){const v=asset.bufferViews[img.bufferView],png=bin.subarray(v.byteOffset,v.byteOffset+v.byteLength);assert.equal(img.mimeType,'image/png');assert(png.readUInt32BE(16)<=1024);assert(png.readUInt32BE(20)<=1024);}
 const credits=readFileSync(new URL('../public/assets/licenses/credits.txt',import.meta.url),'utf8');assert(credits.includes('Microsoft'));assert(credits.includes('NSF EIA-0196217'));assert(credits.includes('not recorded'));
 const manifest=JSON.parse(readFileSync(new URL('../scripts/mocap-sources.json',import.meta.url),'utf8'));for(const item of manifest.sources){assert.match(item.url,/\/[0-9a-f]{40}\//);assert.match(item.sha256,/^[0-9a-f]{64}$/);}
});
