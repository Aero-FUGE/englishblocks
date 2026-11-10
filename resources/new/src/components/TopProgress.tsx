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
      <div className="eb-mobile-brand lg:hidden flex items-center gap-2 rounded-2xl bg-[#FFFDF4]/85 border border-[#E2E9D9] py-1 px-2"><BrandLogo size={41}/><div><div className="text-xs font-bold text-[#416A4C]">英语拼块</div><div className="text-[9px] text-[#8B9D86] tracking-wide">WORD BLOCK GARDEN</div></div></div>
      {/* Stage and level are always visible, including after importing a saved progress. */}
      <button
        onClick={onOpenLevelSelector}
        className="eb-level-control flex items-center gap-2 px-2 py-1 bg-white/90 hover:bg-[#F3F9EE] active:scale-95 border border-[#CFE2CB] rounded-[17px] shadow-sm transition-all text-[#466E52] font-candy font-bold text-xs cursor-pointer"
        title="点击切换或浏览关卡目录"
      >
        <span className="w-8 h-8 rounded-[14px] bg-[#FAFBF2] grid place-items-center stage-emblem-shell"><StageEmblem tier={currentTier} size={28}/></span>
        <span className="flex flex-col items-start leading-snug"><span className="text-[10px] text-[#79917B]">{LEARNING_STAGES.find(s=>s.tier===currentTier)?.label || '学习阶段'}</span><span>LEVEL {currentLevelNumber}</span></span>
        <ChevronDown className="w-4 h-4 text-[#85A68E]" />
      </button>

      {/* 2. Center Progress Capsule (Matching Screenshot) */}
      <div className="eb-progress-summary relative bg-white/80 backdrop-blur-md border border-white/90 rounded-full px-3 py-1 shadow-2xs flex flex-wrap items-center gap-2 text-[11px] text-[#525E4D] font-medium">
        {/* Sentence Level progress */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🥞</span>
          <span>拼句通关:</span>
          <span className="font-candy font-bold text-[#2D332B] text-xs">
            {completedSentencesCount} / {totalSentencesGoal} 句
          </span>
        </div>

        <span className="text-[#D3DDD0]" aria-hidden="true">|</span>

        {/* Word Mastery progress */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🍃</span>
          <span>考纲词已接触:</span>
          <span className="font-candy font-bold text-[#2D332B] text-xs">
            {wordsMasteredCount} / {totalWordsGoal} 词
          </span>
        </div>

        <span className="text-[#D3DDD0]" aria-hidden="true">|</span>

        {/* Unreached Words */}
        <div className="flex items-center gap-1">
          <span className="text-[#7A8675]">尚未接触</span>
          <span className="font-candy font-bold text-[#4B7943] text-xs">
            {unreachedWords}
          </span>
          <span className="text-[#7A8675]">词</span>
        </div>

        {/* Subtle Bottom Progress line inside capsule */}
        <div className="absolute left-3 right-3 bottom-0.5 h-[2.5px] bg-[#E7ECE4] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#97C58A] to-[#68A258] rounded-full transition-all duration-300"
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
          className="w-8 h-8 rounded-full bg-white/85 hover:bg-white active:scale-95 border border-white/90 flex items-center justify-center text-[#5C6656] shadow-2xs transition-all cursor-pointer"
          title={soundEnabled ? '按键音效已开启' : '按键音效已静音'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#527F49]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#99A594]" />
          )}
        </button>

        {/* Stats Trigger */}
        <button
          onClick={onOpenStats}
          aria-label="查看学习统计"
          className="w-8 h-8 rounded-full bg-white/85 hover:bg-white active:scale-95 border border-white/90 flex items-center justify-center text-[#5C6656] shadow-2xs transition-all cursor-pointer"
          title="查看学习统计"
        >
          <BarChart3 className="w-4 h-4 text-[#527F49]" />
        </button>
      </div>
    </div>
  );
};
