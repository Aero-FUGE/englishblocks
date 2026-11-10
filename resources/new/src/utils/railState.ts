import type { WordBlock } from '../types/game';

/** A single immutable board state. All slots are explicit nulls, never sparse. */
export interface RailState {
  slots: (WordBlock | null)[];
  pool: WordBlock[];
}

/** The target word stays after/before the dropped word, depending on the pointer side. */
export type InsertSide = 'before' | 'after';

export function newRail(words: WordBlock[], shuffle: (words: WordBlock[]) => WordBlock[]): RailState {
  return { slots: Array.from({ length: words.length }, () => null), pool: shuffle(words) };
}

/**
 * Insert into an occupied cell without discarding, replacing, or swapping any words.
 * - Empty cell: land exactly there (free placement remains supported).
 * - Occupied cell: shift towards the nearest available gap while keeping
 *   the existing words in their original reading order.
 * - No gap to the right: shift earlier words left to open the correct boundary.
 * The board size is fixed and we never introduce sparse JS arrays.
 */
function insertIntoSlots(
  original: (WordBlock | null)[],
  target: number,
  incoming: WordBlock,
  side: InsertSide
): (WordBlock | null)[] {
  const slots = original.slice();
  if (!slots[target]) {
    slots[target] = incoming;
    return slots;
  }

  const position = target + (side === 'after' ? 1 : 0);
  // Prefer pushing the target/rightward words one step right.
  const rightGap = slots.findIndex((w, i) => i >= position && w === null);
  if (rightGap >= 0) {
    for (let i = rightGap; i > position; i--) slots[i] = slots[i - 1];
    slots[position] = incoming;
    return slots;
  }

  // When every slot to the right is occupied, make space from the left.
  // The target word remains on the intended side of the newly inserted word.
  let leftGap = -1;
  for (let i = Math.min(position - 1, slots.length - 1); i >= 0; i--) {
    if (slots[i] === null) { leftGap = i; break; }
  }
  if (leftGap < 0) return original; // Full track; do not lose any word.
  for (let i = leftGap; i < position - 1; i++) slots[i] = slots[i + 1];
  slots[position - 1] = incoming;
  return slots;
}

/** Clicking a candidate still uses the first available empty slot. */
export function putFirstAvailable(prev: RailState, wordId: string): RailState {
  const index = prev.slots.findIndex(w => w === null);
  if (index < 0) return prev;
  return insertFromPool(prev, index, wordId);
}

/** Drag a candidate: empty position = place there; filled position = insert. */
export function insertFromPool(prev: RailState, target: number, wordId: string, side: InsertSide = 'before'): RailState {
  if (!Number.isInteger(target) || target < 0 || target >= prev.slots.length) return prev;
  const word = prev.pool.find(w => w.id === wordId);
  if (!word) return prev; // Ignore stale or repeated drops.
  const slots = insertIntoSlots(prev.slots, target, word, side);
  if (slots === prev.slots) return prev;
  return { slots, pool: prev.pool.filter(w => w.id !== wordId) };
}

/** Older helper name; now intentionally uses insertion rather than replacement. */
export function putAt(prev: RailState, slot: number, wordId: string): RailState {
  return insertFromPool(prev, slot, wordId);
}

export function takeBack(prev: RailState, slot: number): RailState {
  if (!Number.isInteger(slot) || slot < 0 || slot >= prev.slots.length) return prev;
  const word = prev.slots[slot];
  if (!word) return prev;
  const slots = [...prev.slots];
  slots[slot] = null;
  return { slots, pool: prev.pool.some(w => w.id === word.id) ? prev.pool : [...prev.pool, word] };
}

/** Reorder occupied words by insertion, leaving other words in sequence. */
export function moveByInsertion(prev: RailState, from: number, target: number, side: InsertSide = 'before'): RailState {
  if (!Number.isInteger(from) || !Number.isInteger(target) ||
      from === target || from < 0 || target < 0 ||
      from >= prev.slots.length || target >= prev.slots.length) return prev;
  const movingWord = prev.slots[from];
  if (!movingWord) return prev;
  const slotsWithoutSource = [...prev.slots];
  slotsWithoutSource[from] = null;
  const slots = insertIntoSlots(slotsWithoutSource, target, movingWord, side);
  return slots === slotsWithoutSource ? prev : { ...prev, slots };
}

/** Retained for backwards compatibility with older, unused rail component. */
export function swapSlots(prev: RailState, from: number, to: number): RailState {
  return moveByInsertion(prev, from, to, 'before');
}

export function emptyRail(prev: RailState): RailState {
  const pool = [...prev.pool];
  for (const word of prev.slots) {
    if (word && !pool.some(w => w.id === word.id)) pool.push(word);
  }
  return { slots: prev.slots.map(() => null), pool };
}
