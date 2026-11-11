import React from 'react';
import { LevelData, MascotEmotion, WordBlock } from '../types/game';
import { MascotCharacter } from './MascotCharacter';
import { Volume2, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { sound } from '../utils/sound';

interface RightCompanionPanelProps {
  assembledText: string;
  translation: string;
  comment: string;
  emotion: MascotEmotion;
  isCorrect?: boolean;
  level: LevelData;
  onWordInfo?: (word: WordBlock, e: React.MouseEvent) => void;
  className?: string;
}

export const RightCompanionPanel: React.FC<RightCompanionPanelProps> = ({
  assembledText,
  translation,
  comment,
  emotion,
  isCorrect = false,
  level,
  onWordInfo,
  className = '',
}) => {
  const handleReadAssembled = () => {
    if (assembledText.trim()) {
      sound.speakText(assembledText);
    }
  };

  const emotionLabels: Record<MascotEmotion, string> = {
    happy: '开心',
    puzzled: '疑惑',
    shocked: '震惊',
    speechless: '无语',
    celebrating: '庆祝',
  };

  const handleMascotVoice = () => {
    sound.playMascotEmotion(emotion);
  };

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {/* Companion Card */}
      <div
        className={`
          relative rounded-3xl p-5 border-3 transition-all duration-300 shadow-sm
          ${
            isCorrect
              ? 'bg-gradient-to-b from-[var(--theme-muted-surface)] to-[var(--theme-muted-surface)]/70 border-emerald-300'
              : emotion === 'speechless' || emotion === 'shocked'
              ? 'bg-gradient-to-b from-[var(--theme-surface)] to-[var(--theme-muted-surface)]/60 border-rose-200'
              : 'bg-gradient-to-b from-[var(--theme-surface)] to-[var(--theme-muted-surface)]/60 border-sky-200'
          }
        `}
      >
        {/* Mascot Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2.5">
            <MascotCharacter
              emotion={emotion}
              size={64}
              onClick={handleMascotVoice}
              className="hover:scale-105 active:scale-95 cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-candy font-bold text-slate-800 text-base">
                  咪咪翻译官
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-sky-200 text-sky-800 font-bold">
                  实时翻译官
                </span>
              </div>
              <button
                onClick={handleMascotVoice}
                className="mt-0.5 text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                title="点击播放咪咪叫声"
              >
                <span>当前心情：{emotionLabels[emotion]}</span>
                <span className="text-xs">🔊</span>
              </button>
            </div>
          </div>

          {/* Quick Sound Prompt */}
          <div className="text-[10px] text-slate-400 font-medium text-right">
            点我叫一声~
          </div>
        </div>

        {/* Live Translation Speech Bubble */}
        <div className="mt-3.5 space-y-3">
          {/* Current assembled text */}
          <div className="bg-white/90 rounded-2xl p-3 border border-sky-100 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                当前拼法：
              </span>
              {assembledText.trim() && (
                <button
                  data-ui-sound="off" onClick={handleReadAssembled}
                  aria-label="朗读所拼句子"
                  className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>朗读</span>
                </button>
              )}
            </div>

            <div className="font-candy font-bold text-slate-800 text-sm md:text-base leading-snug min-h-[22px]">
              {assembledText.trim() || '（尚未放入词块）'}
            </div>
          </div>

          {/* Translation & Roast Section */}
          <div className="bg-white/90 rounded-2xl p-3.5 border border-sky-100 shadow-2xs space-y-2">
            <div>
              <div className="text-xs font-bold text-sky-800 mb-0.5">
                实时翻译：
              </div>
              <div
                className={`text-sm md:text-base font-bold ${
                  isCorrect ? 'text-emerald-700' : 'text-slate-800'
                }`}
              >
                {translation}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
              <span className="text-amber-600 font-bold mr-1">咪咪吐槽：</span>
              <span>“{comment}”</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Level Vocabulary Mini-Reference */}
      <div className="bg-[var(--theme-muted-surface)] rounded-3xl p-4 border-2 border-amber-200/80 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>本句词汇与释义速览</span>
          </div>
          <span className="text-[10px] text-slate-400">点击查详细</span>
        </div>

        {/* Word chips list */}
        <div className="flex flex-wrap gap-1.5">
          {level.words.map((w) => (
            <button
              key={w.id}
              onClick={(e) => onWordInfo && onWordInfo(w, e)}
              className="px-2.5 py-1 bg-white hover:bg-amber-100/60 active:scale-95 border border-amber-200/90 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
            >
              <div className="font-candy font-bold text-slate-800 text-xs">
                {w.text}
              </div>
              <div className="text-[10px] text-slate-500 font-sans truncate max-w-[90px]">
                {w.translation.split(' ')[0]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Grammar Structure Insight Tip */}
      {level.grammarExplanation && (
        <div className="bg-amber-50/70 rounded-3xl p-4 border border-amber-200/70 text-xs text-slate-700 leading-relaxed shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span>语法小百科：</span>
          </div>
          <p className="pl-5 text-slate-600">{level.grammarExplanation}</p>
        </div>
      )}
    </div>
  );
};
