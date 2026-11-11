import { ModalOverlay } from './ModalOverlay';
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LevelData } from '../types/game';
import { Volume2, Sparkles, ArrowRight, CheckCircle2, Trophy, Clock3 } from 'lucide-react';
import { sound } from '../utils/sound';

import { formatTime } from '../utils/timing';

interface SuccessCelebrationModalProps {
  isOpen: boolean;
  level: LevelData;
  totalSentencesGoal?: number;
  completedCount: number;
  onNextLevel: () => void;
  onReplay: () => void;
  fishReward?: number;
  usedFullAnswer?: boolean;
  completedMs?: number;
  speedReward?: number;
  personalBest?: boolean;
  isReview?: boolean;
}

export const SuccessCelebrationModal: React.FC<SuccessCelebrationModalProps> = ({
  isOpen,
  level,
  totalSentencesGoal = 500,
  completedCount,
  onNextLevel,
  onReplay,
  fishReward=0,
  usedFullAnswer=false,
  completedMs=0,
  speedReward=0,
  personalBest=false,
  isReview=false,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger festive sweet pastel confetti
      try {
        confetti({
          particleCount: 80,
          zIndex: 220,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['--theme-primary','--theme-accent','--theme-decoration','--theme-light'].map(token=>getComputedStyle(document.documentElement).getPropertyValue(token).trim()),
          disableForReducedMotion: true,
        });
      } catch {}

      // Victory SFX and English voice already start on successful confirmation
      // in App. Do not play them a second time when this modal opens.
    }
  }, [isOpen, level]);

  if (!isOpen) return null;

  const remaining = Math.max(0, totalSentencesGoal - completedCount);

  return (
    <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div role="dialog" aria-modal="true" aria-label="通关庆祝" className="eb-modal-panel eb-modal-success relative w-full max-w-md max-h-[88dvh] overflow-y-auto bg-white rounded-3xl p-4 shadow-2xl border-2 border-emerald-200 text-center z-10 animate-scale-up">
        {/* Soft background glow */}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none" aria-hidden="true"><div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100/70 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-100/70 rounded-full blur-2xl pointer-events-none" /></div>

        {/* Compact cat-themed celebration, no legacy jelly mascot. */}
        <div className="relative flex justify-center mb-1 text-emerald-500"><Sparkles className="w-6 h-6" /></div>

        {/* Big Success Headers */}
        <div className="space-y-1 mb-2">
          <div className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>拼对啦！</span>
          </div>
          <p className="text-sm font-bold text-amber-700">{isReview ? "复习完成 · 不计时、不积分" : usedFullAnswer ? "完整答案已解锁 · 本关小鱼干奖励为 0" : `本关获得 +${fishReward} 小鱼干`}</p>
          {!isReview && <div className="mt-1 mb-1 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] text-[var(--theme-text)] px-3 py-1 text-xs font-bold"><Clock3 className="w-3.5 h-3.5"/> 用时 {formatTime(completedMs)}</span>
            {!usedFullAnswer && speedReward > 0 && <span className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] text-[var(--theme-muted)] px-3 py-1 text-xs font-bold">速度奖励 +{speedReward} 小鱼干</span>}
            {!usedFullAnswer && personalBest && <span className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] text-[var(--theme-muted)] px-3 py-1 text-xs font-bold"><Trophy className="w-3.5 h-3.5"/> 刷新个人纪录！</span>}
          </div>}
          <h2 className="text-xl font-bold text-slate-800">
            又完成了一句话！
          </h2>
          <p className="text-xs font-semibold text-slate-600 tracking-wide">
            距离全部通关还剩 <span className="text-amber-600 font-bold text-sm">{remaining}</span> 句
          </p>
        </div>

        {/* Target sentence display with listen button */}
        <div className="bg-[var(--theme-surface)] rounded-2xl p-3 border border-emerald-100 mb-3 text-left eb-success-sentence min-h-0 overflow-y-auto">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-candy text-base md:text-lg font-bold text-emerald-950 leading-snug">
                {level.targetEnglish}
              </p>
              <p className="text-sm font-medium text-slate-600 mt-1">
                {level.targetChinese}
              </p>
            </div>
            <button
              onClick={() => sound.speakText(level.targetEnglish)}
              aria-label="重听句子朗读"
              className="shrink-0 w-8 h-8 rounded-full bg-emerald-200 hover:bg-emerald-300 active:scale-95 text-emerald-900 flex items-center justify-center transition-all"
              title="点击重听全句发音"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Grammar explanation tip */}
          {level.grammarExplanation && (
            <div className="mt-3 pt-2 border-t border-emerald-200/60 text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-emerald-700">语法点拨：</span>
              {level.grammarExplanation}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-1">
          <button
            onClick={onNextLevel}
            className="w-full py-2.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 active:scale-98 text-white font-candy text-lg font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all candy-btn"
          >
            <span>下一关</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={onReplay}
            className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            再次重温这句
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};
