import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('first slot repaint can schedule rendering before the remaining scene initializes',async()=>{
 const source=await readFile(new URL('../public/office-hybrid.js',import.meta.url),'utf8');
 const startup=source.slice(0,source.indexOf("slotSpin.onclick=spinSlot;paintSlots"));
 // Execute the real scheduler and the state declarations available at its first call.
 const declarations=startup.split('\n').filter(line=>line.startsWith('let jobWorkers=')||line.startsWith('let frame=')).join('\n');
 const scheduler=source.split('\n').find(line=>line.startsWith('function invalidate()'));
 let queued=0;
 const context={Set,document:{hidden:false},performance:{now:()=>100},setTimeout:()=>{queued++;return 1;},requestAnimationFrame:()=>1,draw:()=>{}};
 vm.runInNewContext(declarations+'\n'+scheduler+'\ninvalidate();',context);
 assert.equal(queued,1);
});
