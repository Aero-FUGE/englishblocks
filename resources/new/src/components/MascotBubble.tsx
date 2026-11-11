import React from 'react';
import { MascotEmotion } from '../types/game';
import { MascotCharacter } from './MascotCharacter';
import { Volume2 } from 'lucide-react';
import { sound } from '../utils/sound';

interface MascotBubbleProps {
  assembledText: string;
  translation: string;
  comment: string;
  emotion: MascotEmotion;
  isCorrect?: boolean;
}

export const MascotBubble: React.FC<MascotBubbleProps> = ({
  assembledText,
  translation,
  comment,
  emotion,
  isCorrect = false,
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
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-6 my-2">
      <div className="flex items-start gap-4">
        {/* Dynamic Speech Bubble (Now on Left) */}
        <div
          className={`
            relative flex-1 rounded-3xl p-4 md:p-5 shadow-sm transition-all duration-200
            ${
              isCorrect
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300'
                : emotion === 'speechless' || emotion === 'shocked'
                ? 'bg-[var(--theme-surface)] border-2 border-rose-200'
                : 'bg-white border-2 border-sky-200/80'
            }
          `}
        >
          {/* Bubble triangle pointing to mascot on the right */}
          <div
            className={`
              absolute top-6 -right-2 w-4 h-4 rotate-45 border-r-2 border-t-2
              ${
                isCorrect
                  ? 'bg-teal-50 border-emerald-300'
                  : emotion === 'speechless' || emotion === 'shocked'
                  ? 'bg-[var(--theme-surface)] border-rose-200'
                  : 'bg-white border-sky-200/80'
              }
            `}
          />

          {/* Current Assembled Sentence & Audio */}
          {assembledText.trim() && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                  当前拼法:
                </span>
                <span className="font-candy font-bold text-slate-800 text-sm md:text-base truncate">
                  {assembledText}
                </span>
              </div>
              <button
                data-ui-sound="off" onClick={handleReadAssembled}
                aria-label="朗读当前拼成的句子"
                className="w-7 h-7 rounded-full bg-sky-100 hover:bg-sky-200 active:scale-95 text-sky-800 flex items-center justify-center shrink-0 transition-colors ml-2"
                title="点击朗读当前拼句"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Live Translation */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-sky-800">
                实时翻译：
              </span>
              <span className={`text-sm md:text-base font-bold ${isCorrect ? 'text-emerald-800' : 'text-slate-800'}`}>
                {translation}
              </span>
            </div>

            {/* Mascot Roast / Quip */}
            <div className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed pt-0.5">
              <span className="text-amber-600 font-bold mr-1">吐槽：</span>
              <span>“{comment}”</span>
            </div>
          </div>
        </div>

        {/* Mascot Character with Emotion state (Placed on Right) */}
        <div className="shrink-0 flex flex-col items-center pt-1">
          <MascotCharacter
            emotion={emotion}
            size={76}
            onClick={handleMascotVoice}
            className="hover:scale-105 active:scale-90"
          />
          <button
            onClick={handleMascotVoice}
            className="mt-1 flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 active:scale-95 px-2.5 py-0.5 rounded-full border border-sky-300 shadow-2xs transition-all cursor-pointer"
            title="点击咪咪翻译官播放心情音效"
          >
            <span>咪咪翻译官</span>
            <span className="text-sky-400">·</span>
            <span className="text-sky-700">{emotionLabels[emotion]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
