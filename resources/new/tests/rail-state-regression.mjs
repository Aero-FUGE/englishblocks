import assert from 'node:assert/strict';
import { newRail, insertFromPool, putAt, putFirstAvailable, takeBack, moveByInsertion, emptyRail } from '../src/utils/railState.ts';

const words = Array.from({length: 12}, (_, i) => ({id: 'word' + i, text: 'w' + i, cleanWord: 'w' + i, translation: 't' + i}));
const mk = () => newRail(words, arr => arr.slice());
const layout = s => s.slots.map(w => w?.id ?? '_');
const order = s => s.slots.filter(Boolean).map(w => w.id);
function verify(s) {
  assert.equal(s.slots.length, words.length, 'fixed length track');
  assert.ok(Array.from(s.slots).every(w => w === null || typeof w === 'object'), 'explicitly filled, no undefined');
  assert.equal(Object.keys(s.slots).length, words.length, 'no sparse holes');
  const ids = [...s.pool, ...s.slots.filter(Boolean)].map(w => w.id);
  assert.equal(ids.length, words.length, 'conserve all words');
  assert.equal(new Set(ids).size, words.length, 'no duplicate IDs');
}
function expectOrderAfterInsert(previous, next, wordId, targetId, side) {
  const previousOrder = order(previous);
  const position = previousOrder.indexOf(targetId) + (side === 'after' ? 1 : 0);
  assert.notEqual(position, -1, 'target occupied');
  const expected = [...previousOrder];
  expected.splice(position, 0, wordId);
  assert.deepEqual(order(next), expected, `insert ${side} ${targetId}`);
}

// Earlier "replace" behavior must now INSERT: displaced words never return to the pool.
let s = mk();
s = insertFromPool(s, 0, 'word0');
s = insertFromPool(s, 1, 'word1');
s = insertFromPool(s, 2, 'word2');
let before = s;
s = insertFromPool(s, 1, 'word3', 'before');
verify(s); expectOrderAfterInsert(before, s, 'word3', 'word1', 'before');
assert.deepEqual(layout(s).slice(0, 5), ['word0', 'word3', 'word1', 'word2', '_']);
before = s;
s = insertFromPool(s, 1, 'word4', 'after');
verify(s); expectOrderAfterInsert(before, s, 'word4', 'word3', 'after');
assert.deepEqual(layout(s).slice(0, 6), ['word0', 'word3', 'word4', 'word1', 'word2', '_']);

// Do NOT shift when dropping onto an explicitly empty cell: free placement survives.
s = mk();
s = insertFromPool(s, 7, 'word0');
verify(s); assert.equal(s.slots[7]?.id, 'word0'); assert.equal(s.slots[0], null);
s = insertFromPool(s, 4, 'word1');
verify(s); assert.equal(s.slots[4]?.id, 'word1'); assert.equal(s.slots[7]?.id, 'word0');

// Full right segment with only left-side empty space: shift left without losing sequence.
s = mk();
for (let i = 1; i < 12; i++) s = insertFromPool(s, i, `word${i}`);
assert.equal(s.slots[0], null);
before = s;
s = insertFromPool(s, 6, 'word0', 'before');
verify(s); expectOrderAfterInsert(before, s, 'word0', 'word6', 'before');
assert.equal(s.slots[5]?.id, 'word0'); assert.equal(s.slots[6]?.id, 'word6');

// Move inside rail: same word count and the original neighbors stay in sequence.
for (const [from, target, side] of [[0, 4, 'before'], [0, 4, 'after'], [9, 0, 'before'], [9, 0, 'after'], [2, 2, 'before']]) {
  let state = mk();
  for (let i = 0; i < 12; i++) state = insertFromPool(state, i, `word${i}`);
  const beforeOrder = order(state);
  const movedId = state.slots[from]?.id;
  const targetId = state.slots[target]?.id;
  const next = moveByInsertion(state, from, target, side);
  verify(next);
  if (from === target) { assert.equal(state, next); continue; }
  const expected = beforeOrder.filter(id => id !== movedId);
  expected.splice(expected.indexOf(targetId) + (side === 'after' ? 1 : 0), 0, movedId);
  assert.deepEqual(order(next), expected, `move ${from} -> ${side} ${target}`);
}

// 500 repeated drag/undo/reorder/reset cycles, including middle and far-right cells.
s = mk(); verify(s);
for (let i = 0; i < 500; i++) {
  s = insertFromPool(s, 5, 'word0'); verify(s); assert.equal(s.slots[5]?.id, 'word0');
  assert.equal(insertFromPool(s, 5, 'word0'), s, 'duplicate event should not change board');
  s = takeBack(s, 5); verify(s);
  s = insertFromPool(s, 2, 'word0'); verify(s);
  s = moveByInsertion(s, 2, 7); verify(s); assert.equal(s.slots[7]?.id, 'word0');
  s = takeBack(s, 7); verify(s);
  s = putFirstAvailable(s, 'word1'); verify(s);
  s = emptyRail(s); verify(s);
}

// Deterministic pseudo-random stress test: random inserts, reorders, take-backs.
let seed = 1789;
function rand(n) { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; }
s = mk();
for (let i = 0; i < 5000; i++) {
  const occupied = s.slots.flatMap((w, index) => w ? [index] : []);
  const target = rand(words.length);
  const side = rand(2) ? 'before' : 'after';
  const action = rand(4);
  if (action === 0 && s.pool.length) {
    const word = s.pool[rand(s.pool.length)];
    const beforeState = s;
    s = insertFromPool(s, target, word.id, side);
    if (beforeState.slots[target]) expectOrderAfterInsert(beforeState, s, word.id, beforeState.slots[target].id, side);
  } else if (action === 1 && occupied.length > 1) {
    const from = occupied[rand(occupied.length)];
    const beforeState = s;
    const targetWord = s.slots[target];
    s = moveByInsertion(s, from, target, side);
    if (targetWord && from !== target) {
      const priorOrder = order(beforeState).filter(id => id !== beforeState.slots[from].id);
      const offset = priorOrder.indexOf(targetWord.id) + (side === 'after' ? 1 : 0);
      priorOrder.splice(offset, 0, beforeState.slots[from].id);
      assert.deepEqual(order(s), priorOrder);
    }
  } else if (action === 2 && occupied.length) {
    s = takeBack(s, occupied[rand(occupied.length)]);
  } else if (action === 3 && rand(20) === 0) {
    s = emptyRail(s);
  }
  verify(s);
}
console.log('PASS: insert-before/after, gap-preserving free drops, left/right shifts, reordering, 500 repetitive cycles + 5,000 stress actions.');
