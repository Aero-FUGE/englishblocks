import type { LevelData, WordBlock } from '../types/game';
import type { RailState } from './railState';

export function expectedSequence(level: LevelData, phaseIndex = 0): string[] {
  const phase = level.tieredAssembly?.phases[phaseIndex];
  if (!phase) return level.correctSequence;
  // Keep the same ordering as the existing evaluator (phase subset of level.words).
  return level.words.filter(w => phase.wordIds.includes(w.id)).map(w => w.text);
}
const normalized = (word: string) => word.toLowerCase().replace(/[,.?!]/g, '').trim();

/** Feedback depends on the actual slot index, not on the compacted display order. */
export function exactSlotMatches(slots: (WordBlock | null)[], level: LevelData, phaseIndex = 0): boolean[] {
  const target = expectedSequence(level, phaseIndex);
  return slots.map((word, index) => Boolean(word && index < target.length && normalized(word.text) === normalized(target[index])));
}

/** Autofill never invents tiles: duplicates are assigned distinct word IDs. */
export function filledAnswerBoard(board: RailState, level: LevelData, phaseIndex = 0): RailState {
  const target = expectedSequence(level, phaseIndex);
  const words = [...board.slots.filter((word): word is WordBlock => word !== null), ...board.pool];
  const unused = new Map(words.map(word => [word.id, word]));
  const slots = target.map(text => {
    const found = [...unused.values()].find(word => normalized(word.text) === normalized(text));
    if (!found) return null;
    unused.delete(found.id);
    return found;
  });
  // Never discard words or partially fill when source data is inconsistent.
  if (slots.some(slot => slot === null) || slots.length !== board.slots.length) return board;
  return {slots, pool: [...unused.values()]};
}
