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

/** Fill exactly one empty target; if its tile was misplaced, leave that source cell empty. */
export function fillOneEmptyAnswer(board:RailState,level:LevelData,phaseIndex=0):{board:RailState;index:number;text:string}|null {
 const index=board.slots.findIndex(word=>word===null);if(index<0)return null;
 const text=expectedSequence(level,phaseIndex)[index];if(!text)return null;
 const poolIndex=board.pool.findIndex(word=>normalized(word.text)===normalized(text));
 const slots=board.slots.slice(),pool=board.pool.slice();
 if(poolIndex>=0)slots[index]=pool.splice(poolIndex,1)[0];
 else {const source=slots.findIndex((word,i)=>word&&normalized(word.text)===normalized(text)&&!exactSlotMatches(board.slots,level,phaseIndex)[i]);if(source<0)return null;slots[index]=slots[source];slots[source]=null;}
 return {board:{slots,pool},index,text:slots[index]!.text};
}
