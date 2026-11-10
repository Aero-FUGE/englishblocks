import type { WordBlock } from '../types/game';

/**
 * Common multiword expressions used as one unit of meaning. We match only
 * neighbouring physical rail slots, never skip over empty positions.
 * Longer expressions take precedence ("by the time" before shorter matches).
 */
export interface RecognizedPhrase {
  english: string;
  meaning: string;
  start: number;
  end: number;
}

type PhraseEntry = { english: string; meaning: string; tokens: string[] };
const ENTRIES: PhraseEntry[] = [
  ['even if', '即使／哪怕'],
  ['even though', '尽管／虽然'],
  ['by the time', '到……的时候／等到'],
  ['as soon as', '一……就……'],
  ['so that', '以便／为了'],
  ['in order to', '为了'],
  ['as long as', '只要'],
  ['in spite of', '尽管／不顾'],
  ['instead of', '代替／而不是'],
  ['rather than', '而不是'],
  ['because of', '因为／由于'],
  ['according to', '根据／按照'],
  ['look forward to', '期待'],
  ['be able to', '能够'],
  ['used to', '过去常常'],
  ['have to', '必须／不得不'],
  ['would rather', '宁愿'],
  ['not only', '不但／不仅'],
  ['but also', '而且'],
  ['even when', '即使在……的时候'],
  ['at least', '至少'],
  ['in front of', '在……前面'],
  ['out of', '从……里面／出于'],
  ['each other', '彼此／互相'],
  ['a lot of', '许多'],
  ['such as', '例如'],
  ['for example', '例如'],
  ['by the way', '顺便说一下'],
  ['at the same time', '与此同时'],
  ['take care of', '照顾／处理'],
  ['make sure', '确保'],
  ['no matter', '无论'],
].map(([english, meaning]) => ({english, meaning, tokens: english.split(' ')}))
 .sort((a, b) => b.tokens.length - a.tokens.length);

const clean = (word: WordBlock) =>
  (word.cleanWord || word.text).toLowerCase().trim().replace(/^[^a-z]+|[^a-z]+$/g, '');

export function recognizePhrases(slots: readonly (WordBlock | null)[]): RecognizedPhrase[] {
  const found: RecognizedPhrase[] = [];
  for (let index = 0; index < slots.length;) {
    if (!slots[index]) { index++; continue; }
    const matching = ENTRIES.find(entry => entry.tokens.every((token, offset) => {
      const word = slots[index + offset];
      return Boolean(word && clean(word) === token);
    }));
    if (matching) {
      found.push({english: matching.english, meaning: matching.meaning,
        start: index, end: index + matching.tokens.length - 1});
      index += matching.tokens.length;
    } else {
      index++;
    }
  }
  return found;
}

/** Literal fallback with phrase meaning in place of individual glosses. */
export function phraseAwareGloss(
  slots: readonly (WordBlock | null)[],
  matches: readonly RecognizedPhrase[],
  wordGloss: (word: WordBlock) => string,
): string {
  const byStart = new Map(matches.map(p => [p.start, p]));
  const parts: string[] = [];
  for (let i = 0; i < slots.length;) {
    const match = byStart.get(i);
    if (match) {
      parts.push(match.meaning);
      i = match.end + 1;
    } else {
      const word = slots[i];
      if (word) parts.push(wordGloss(word));
      i++;
    }
  }
  return parts.join(' / ');
}
