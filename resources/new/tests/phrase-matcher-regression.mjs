import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recognizePhrases, phraseAwareGloss } from '../src/utils/phraseMatcher.ts';
import { evaluateCurrentAssembly } from '../src/utils/translationEvaluator.ts';

const levels = JSON.parse(readFileSync(new URL('../src/data/allLevels.json', import.meta.url)));
const get = (id, text) => {
  const level = levels.find(l => l.id === id);
  assert.ok(level, `Missing level ${id}`);
  const word = level.words.find(w => w.cleanWord.toLowerCase() === text);
  assert.ok(word, `Missing ${text} in level ${id}`);
  return word;
};
const even = get(2016, 'even');
const ifWord = get(2016, 'if');
const level = levels.find(l => l.id === 2016);

// Two neighbouring words trigger the grouped meaning immediately, even with
// empty cells before them. They must remain normal word tiles on the board.
let slots = Array.from({length: level.words.length}, () => null);
slots[2] = even;
slots[3] = ifWord;
let evalResult = evaluateCurrentAssembly(slots, level);
assert.equal(evalResult.phrases.length, 1);
assert.equal(evalResult.phrases[0].english, 'even if');
assert.equal(evalResult.phrases[0].start, 2);
assert.match(evalResult.translation, /即使/);
assert.doesNotMatch(evalResult.translation, /甚至\s*\/\s*如果/);

// Removing a tile or leaving a gap restores single-word meanings.
slots[3] = null;
assert.equal(evaluateCurrentAssembly(slots, level).phrases.length, 0);
slots[4] = ifWord;
assert.equal(evaluateCurrentAssembly(slots, level).phrases.length, 0);
slots[2] = ifWord;
slots[3] = even;
slots[4] = null;
assert.equal(evaluateCurrentAssembly(slots, level).phrases.length, 0);

// Correct full sentence remains correct and reports the phrase as discovery.
const full = level.correctSequence.map(t => level.words.find(w => w.text === t));
assert.ok(full.every(Boolean));
evalResult = evaluateCurrentAssembly(full, level);
assert.equal(evalResult.isCorrect, true);
assert.equal(evalResult.phrases[0].english, 'even if');
assert.equal(evalResult.translation, level.targetChinese);

// Longest phrase wins and starts only where its full token sequence exists.
const timeLevel = levels.find(l => l.id === 2014);
const byTheTime = timeLevel.words.slice(0, 3);
assert.deepEqual(byTheTime.map(w => w.cleanWord.toLowerCase()), ['by','the','time']);
assert.equal(recognizePhrases(byTheTime)[0].english, 'by the time');
assert.match(phraseAwareGloss(byTheTime, recognizePhrases(byTheTime), w => w.translation), /到……的时候/);
assert.equal(recognizePhrases([byTheTime[0], null, byTheTime[1], byTheTime[2]]).length, 0);

// Extra expressions found in the real 1190-level sentence bank.
const thoughLevel = levels.find(l => l.correctSequence.join(' ').toLowerCase().includes('even though'));
const thoughIndex = thoughLevel.correctSequence.findIndex(t => t.toLowerCase() === 'even');
const thoughWords = thoughLevel.correctSequence.slice(thoughIndex,thoughIndex+2).map(t => thoughLevel.words.find(w=>w.text===t));
assert.equal(recognizePhrases(thoughWords)[0].english, 'even though');

console.log('PASS: even if, gaps, order, undo, correct sentence, by the time, even though');
