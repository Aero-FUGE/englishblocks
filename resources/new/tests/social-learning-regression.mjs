import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {evaluateCurrentAssembly} from '../src/utils/translationEvaluator.ts';
const levels=JSON.parse(fs.readFileSync(new URL('../src/data/allLevels.json',import.meta.url)));
test('server-compatible learning normalization preserves correct possessives and rejects gaps',()=>{
 const level=levels.find(l=>l.id===69),pool=[...level.words];const words=level.correctSequence.map(text=>{const i=pool.findIndex(w=>w.text===text);return pool.splice(i,1)[0];});
 assert.equal(evaluateCurrentAssembly(words,level,0).isCorrect,true);
 const gap=[...words];gap[1]=null;assert.equal(evaluateCurrentAssembly(gap,level,0).isCorrect,false);
 const wrong=[...words];[wrong[0],wrong[2]]=[wrong[2],wrong[0]];assert.equal(evaluateCurrentAssembly(wrong,level,0).isCorrect,false);
});
