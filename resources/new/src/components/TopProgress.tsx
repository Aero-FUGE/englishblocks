import React from 'react';
import { ChevronDown, Volume2, VolumeX, BarChart3, Key } from 'lucide-react';
import { BgmPlayerWidget } from './BgmPlayerWidget';
import { LEARNING_STAGES } from '../utils/stages';
import { StageEmblem } from './StageEmblem';
import { BrandLogo } from './BrandLogo';

interface TopProgressProps {
  currentLevelNumber: number;
  currentTier: number;
  completedSentencesCount: number;
  totalSentencesGoal?: number;
  wordsMasteredCount: number;
  totalWordsGoal?: number;
  onOpenLevelSelector: () => void;
  onOpenStats: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopProgress: React.FC<TopProgressProps> = ({
  currentLevelNumber,
  currentTier,
  completedSentencesCount,
  totalSentencesGoal = 1190,
  wordsMasteredCount,
  totalWordsGoal = 2004,
  onOpenLevelSelector,
  onOpenStats,
  soundEnabled,
  onToggleSound,
}) => {
  const unreachedWords = Math.max(0, totalWordsGoal - wordsMasteredCount);
  const sentencePercent = Math.min(
    100,
    Math.round((completedSentencesCount / totalSentencesGoal) * 100)
  );

  return (
    <div className="eb-top-progress w-full flex flex-wrap items-center justify-between gap-2 mb-1 select-none">
      <div className="eb-mobile-brand lg:hidden flex items-center gap-2 rounded-2xl bg-[var(--theme-surface)]/85 border border-[var(--theme-border)] py-1 px-2"><BrandLogo size={41}/><div><div className="text-xs font-bold text-[var(--theme-text)]">英语拼块</div><div className="text-[9px] text-[var(--theme-muted)] tracking-wide">WORD BLOCK GARDEN</div></div></div>
      {/* Stage and level are always visible, including after importing a saved progress. */}
      <button
        onClick={onOpenLevelSelector}
        className="eb-level-control flex items-center gap-2 px-2 py-1 bg-white/90 hover:bg-[var(--theme-muted-surface)] active:scale-95 border border-[var(--theme-border)] rounded-[17px] shadow-sm transition-all text-[var(--theme-text)] font-candy font-bold text-xs cursor-pointer"
        title="点击切换或浏览关卡目录"
      >
        <span className="w-8 h-8 rounded-[14px] bg-[var(--theme-muted-surface)] grid place-items-center stage-emblem-shell"><StageEmblem tier={currentTier} size={28}/></span>
        <span className="flex flex-col items-start leading-snug"><span className="text-[10px] text-[var(--theme-muted)]">{LEARNING_STAGES.find(s=>s.tier===currentTier)?.label || '学习阶段'}</span><span>LEVEL {currentLevelNumber}</span></span>
        <ChevronDown className="w-4 h-4 text-[var(--theme-muted)]" />
      </button>

      {/* 2. Center Progress Capsule (Matching Screenshot) */}
      <div className="eb-progress-summary relative bg-white/80 backdrop-blur-md border border-white/90 rounded-full px-3 py-1 shadow-2xs flex flex-wrap items-center gap-2 text-[11px] text-[var(--theme-text)] font-medium">
        {/* Sentence Level progress */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🥞</span>
          <span>拼句通关:</span>
          <span className="font-candy font-bold text-[var(--theme-text)] text-xs">
            {completedSentencesCount} / {totalSentencesGoal} 句
          </span>
        </div>

        <span className="text-[var(--theme-muted)]" aria-hidden="true">|</span>

        {/* Word Mastery progress */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🍃</span>
          <span>考纲词已接触:</span>
          <span className="font-candy font-bold text-[var(--theme-text)] text-xs">
            {wordsMasteredCount} / {totalWordsGoal} 词
          </span>
        </div>

        <span className="text-[var(--theme-muted)]" aria-hidden="true">|</span>

        {/* Unreached Words */}
        <div className="flex items-center gap-1">
          <span className="text-[var(--theme-muted)]">尚未接触</span>
          <span className="font-candy font-bold text-[var(--theme-text)] text-xs">
            {unreachedWords}
          </span>
          <span className="text-[var(--theme-muted)]">词</span>
        </div>

        {/* Subtle Bottom Progress line inside capsule */}
        <div className="absolute left-3 right-3 bottom-0.5 h-[2.5px] bg-[var(--theme-muted-surface)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary)] rounded-full transition-all duration-300"
            style={{ width: `${Math.max(2, sentencePercent)}%` }}
          />
        </div>
      </div>

      {/* 3. Right: BGM Player + Sound FX + Stats */}
      <div className="eb-audio-controls flex items-center gap-1">
        {/* Multi-track BGM Player */}
        <BgmPlayerWidget />

        {/* Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? '音效开启' : '音效静音'}
          className="w-8 h-8 rounded-full bg-white/85 hover:bg-white active:scale-95 border border-white/90 flex items-center justify-center text-[var(--theme-text)] shadow-2xs transition-all cursor-pointer"
          title={soundEnabled ? '按键音效已开启' : '按键音效已静音'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[var(--theme-text)]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[var(--theme-muted)]" />
          )}
        </button>

        {/* Stats Trigger */}
        <button
          onClick={onOpenStats}
          aria-label="查看学习统计"
          className="w-8 h-8 rounded-full bg-white/85 hover:bg-white active:scale-95 border border-white/90 flex items-center justify-center text-[var(--theme-text)] shadow-2xs transition-all cursor-pointer"
          title="查看学习统计"
        >
          <BarChart3 className="w-4 h-4 text-[var(--theme-text)]" />
        </button>
      </div>
    </div>
  );
};
