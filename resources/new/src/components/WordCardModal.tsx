import { ModalOverlay } from './ModalOverlay';
import React, {useEffect} from 'react';
import { WordBlock } from '../types/game';
import { Volume2, Star, X, Sparkles, BookOpen } from 'lucide-react';
import { sound } from '../utils/sound';

interface WordCardModalProps {
  word: WordBlock | null;
  isOpen: boolean;
  isStarred: boolean;
  onToggleStar: (wordId: string) => void;
  onClose: () => void;
}

export const WordCardModal: React.FC<WordCardModalProps> = ({
  word,
  isOpen,
  isStarred,
  onToggleStar,
  onClose,
}) => {
  useEffect(()=>{if(!isOpen)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[isOpen,onClose]);
  if (!isOpen || !word) return null;

  const handleSpeak = () => {
    sound.speakText(word.cleanWord);
  };

  return (
    <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div role="dialog" aria-modal="true" aria-label="单词详情" className="eb-modal-panel eb-modal-word relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-100 z-10 transform transition-all animate-scale-up">
        {/* Soft pastel decorative gradient header background */}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none" aria-hidden="true"><div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-100/60 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-pink-100/50 rounded-full blur-xl pointer-events-none" /></div>

        {/* Top close & star buttons */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onToggleStar(word.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isStarred
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isStarred ? '已加入生词本' : '收藏到生词本'}</span>
          </button>

          <button
            onClick={onClose}
            aria-label="关闭"
            className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Word Display & Pronunciation */}
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 mb-1">
            <h3 className="font-candy text-3xl font-bold text-slate-800 tracking-wide">
              {word.text.replace(/[,.?!]/g, '')}
            </h3>
            <button
              data-ui-sound="off" onClick={handleSpeak}
              aria-label="发音"
              className="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-500 active:scale-95 text-white flex items-center justify-center shadow-sm transition-all"
              title="点击播放标准发音"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Phonetic & POS */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-medium">
            <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
              {word.phonetic}
            </span>
            <span>·</span>
            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-xs font-semibold">
              {word.pos}
            </span>
          </div>
        </div>

        {/* Meaning sections */}
        <div className="mt-4 space-y-3 bg-[var(--theme-surface)] rounded-2xl p-4 border border-amber-100/80">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>基础中文释义</span>
            </div>
            <p className="text-base font-bold text-slate-800 pl-5">
              {word.translation}
            </p>
          </div>

          {word.simpleEn && (
            <div className="pt-2 border-t border-amber-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>简单英文释义</span>
              </div>
              <p className="text-sm text-slate-700 pl-5 leading-relaxed">{word.simpleEn}</p>
            </div>
          )}

          {word.senseNotes && (
            <div className="pt-2 border-t border-amber-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>词义辨析与常见搭配</span>
              </div>
              <p className="text-sm text-slate-700 pl-5 leading-relaxed">{word.senseNotes}</p>
            </div>
          )}

          <div className="pt-2 border-t border-amber-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>在本句中的角色与含义</span>
            </div>
            <p className="text-sm text-slate-700 pl-5 leading-relaxed">
              {word.sentenceMeaning}
            </p>
          </div>
        </div>

        {/* Friendly zero-penalty hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-600 font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 py-1.5 px-3 rounded-full inline-block">
            🌱 查看词义完全不扣分，尽管随时查看！
          </p>
        </div>

        {/* Got it action */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-98 text-amber-950 font-bold text-sm shadow-md transition-all candy-btn"
          >
            我记住了，继续拼句！
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};
