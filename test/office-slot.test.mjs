import test from 'node:test';
import assert from 'node:assert/strict';
import {spinSymbols,slotMessage} from '../public/office-slot.js';
test('free reels sample only the symbol set and include both ends',()=>{assert.deepEqual(spinSymbols(()=>0),['🍒','🍒','🍒']);assert.deepEqual(spinSymbols(()=>.999),['🍇','🍇','🍇']);let n=0;assert.deepEqual(spinSymbols(()=>[0,.41,.61][n++]),['🍒','🔔','⭐']);});
test('invalid random inputs fail rather than returning empty reels',()=>{for(const value of [-.1,1,NaN,Infinity])assert.throws(()=>spinSymbols(()=>value),RangeError);});
test('matching symbols only change the message; no balance or prize exists',()=>{assert.match(slotMessage(['⭐','⭐','⭐']),/세 개 일치/);assert.match(slotMessage(['⭐','🍋','⭐']),/한 번 더/);});
