import type { LevelData, MascotEmotion, WordBlock } from '../types/game';
import { recognizePhrases, phraseAwareGloss } from './phraseMatcher.ts';
import type { RecognizedPhrase } from './phraseMatcher.ts';

export interface EvaluationResult {
  currentText: string;
  translation: string;
  comment: string;
  emotion: MascotEmotion;
  isCorrect: boolean;
  isPartial: boolean;
  phrases: RecognizedPhrase[];
}

export function evaluateCurrentAssembly(
  placedWords: (WordBlock|null)[],
  currentLevel: LevelData,
  currentPhaseIndex?: number // for Level 5 tiered mode
): EvaluationResult {
  if (placedWords.every(w=>!w)) {
    return {
      currentText: '',
      translation: '（等待放入单词积木中...）',
      comment: '',
      emotion: 'happy',
      isCorrect: false,
      isPartial: true,
      phrases: [],
    };
  }

  const present = placedWords.filter((w):w is WordBlock => Boolean(w && typeof w.text === "string"));
  const simpleMeaning = (word: WordBlock) => {
    const raw = (word.translation || word.cleanWord || word.text).trim();
    // Original dictionary entries contain many alternatives separated by punctuation.
    // Only use the first compact gloss; do not concatenate every possible meaning.
    return raw.split(/[；;、，,／/·|。\n]/)[0].trim().split(/\s{2,}/)[0].slice(0,18) || word.text;
  };
  const phrases = recognizePhrases(placedWords);
  const phraseTranslation = phraseAwareGloss(placedWords, phrases, simpleMeaning);
  // Current assembled text
  const currentTokens = present.map(w => w.text);
  const currentCleanTokens = present.map(w => w.cleanWord.toLowerCase().replace(/[,.?!]|[’']$/g, ''));
  const currentText = present.map((w, i) => {
    // Add space unless next is punctuation
    return w.text;
  }).join(' ');

  // Determine target sequence based on whether tiered phase is active
  let targetSequence = currentLevel.correctSequence;
  let targetCount = currentLevel.correctSequence.length;
  let targetChinese = currentLevel.targetChinese;

  if (
    currentLevel.tieredAssembly &&
    currentPhaseIndex !== undefined &&
    currentLevel.tieredAssembly.phases[currentPhaseIndex]
  ) {
    const phase = currentLevel.tieredAssembly.phases[currentPhaseIndex];
    targetCount = phase.wordIds.length;
    targetChinese = phase.targetChinese;
    // Extract correct sub-sequence for phase
    const phaseWords = currentLevel.words.filter(w => phase.wordIds.includes(w.id));
    targetSequence = phaseWords.map(w => w.text);
  }

  const cleanTargetTokens = targetSequence.map(t => t.toLowerCase().replace(/[,.?!]|[’']$/g, ''));

  // Check exact match
  const isExactMatch =
    present.length === cleanTargetTokens.length &&
    Array.from({length:targetCount}, (_, i) => Boolean(placedWords[i])).every(Boolean) &&
    currentCleanTokens.every((token, idx) => token === cleanTargetTokens[idx]);

  if (isExactMatch) {
    return {
      currentText,
      translation: targetChinese,
      comment: '拼对啦！',
      emotion: 'celebrating',
      isCorrect: true,
      isPartial: false,
      phrases,
    };
  }

  // Check predefined alternatives from level data
  if (currentLevel.alternatives) {
    for (const alt of currentLevel.alternatives) {
      const altClean = alt.sequence.map(s => s.toLowerCase().replace(/[,.?!]|[’']$/g, ''));
      if (
        altClean.length === currentCleanTokens.length &&
        altClean.every((token, idx) => token === currentCleanTokens[idx])
      ) {
        return {
          currentText,
          translation: alt.translation,
          comment: alt.comment,
          emotion: alt.emotion,
          isCorrect: false,
          isPartial: false,
          phrases,
        };
      }
    }
  }

  // If partial (fewer words than target)
  if (present.length < targetCount) {
    const literalSnippet = phraseTranslation;
    return {
      currentText,
      translation: `当前释义：${literalSnippet} …`,
      comment: ``,
      emotion: 'puzzled',
      isCorrect: false,
      isPartial: true,
      phrases,
    };
  }

  // All blocks placed but order is wrong -> generate intelligent dynamic roast & literal translation
  const firstWord = present[0].cleanWord.toLowerCase();
  const lastWord = present[present.length - 1].cleanWord.toLowerCase();

  // Verb at start
  const verbWords = ['likes', 'love', 'ate', 'drinks', 'stay', 'wanted', 'bake', 'set'];
  if (verbWords.includes(firstWord)) {
    const literal = phraseTranslation;
    return {
      currentText,
      translation: `直译：${literal}？？`,
      comment: '动词抢跑当排头兵？现代英语里可没有这种奇怪倒装哦！',
      emotion: 'shocked',
      isCorrect: false,
      isPartial: false,
      phrases,
    };
  }

  // Objective pronoun at start (e.g. him)
  if (firstWord === 'him' || firstWord === 'them' || firstWord === 'her') {
    const literal = phraseTranslation;
    return {
      currentText,
      translation: `硬译：${literal}`,
      comment: '这几个词是第一次见面吗？怎么谁都不认识谁？宾格代词直接冲到主语位啦！',
      emotion: 'speechless',
      isCorrect: false,
      isPartial: false,
      phrases,
    };
  }

  // Preposition stranded at end or weird order
  if (['in', 'at', 'about', 'for', 'of', 'to'].includes(lastWord)) {
    const literal = phraseTranslation;
    return {
      currentText,
      translation: `硬译：${literal}...（话未说完）`,
      comment: '介词孤独地挂在句尾随风飘摇，快给它找个宾语伙伴吧！',
      emotion: 'puzzled',
      isCorrect: false,
      isPartial: false,
      phrases,
    };
  }

  // Generic witty hard translation
  const literalTranslation = phraseTranslation;
  const roasts = [
    '语法逻辑好像打成了蝴蝶结，咪咪抓了抓脑袋！',
    '词块们的站位有点迷路，试试把修饰词或从句顺序换一下？',
    '单词都认识，但排在一起像是在说外星加密通话！再调整一下吧！',
    '离正确答案很近了！注意观察哪个词在修饰哪个词哦！',
  ];
  // Deterministic roast based on words length
  const roastIndex = present.length % roasts.length;

  return {
    currentText,
    translation: `硬译：${literalTranslation}。`,
    comment: roasts[roastIndex],
    emotion: 'speechless',
    isCorrect: false,
    isPartial: false,
    phrases,
  };
}
