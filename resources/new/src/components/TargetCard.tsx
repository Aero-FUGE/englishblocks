import React from 'react';
import { LevelData } from '../types/game';
import { Sparkles, Layers, Lightbulb } from 'lucide-react';
import { sound } from '../utils/sound';

interface TargetCardProps {
  level: LevelData;
  currentPhaseIndex?: number;
  onSelectPhase?: (phaseIndex: number) => void;
  onShowHint?: () => void;
}

export const TargetCard: React.FC<TargetCardProps> = ({
  level,
  currentPhaseIndex = 0,
  onSelectPhase,
  onShowHint,
}) => {
  const isTiered = Boolean(level.tieredAssembly && level.tieredAssembly.phases.length > 0);
  const currentPhase = isTiered ? level.tieredAssembly!.phases[currentPhaseIndex] : null;

  const displayChinese = currentPhase ? currentPhase.targetChinese : level.targetChinese;

  return (
    <div className="relative w-full">
      <div className="relative bg-gradient-to-b from-[#FFFDF5] to-[#FFF9EB] border-3 border-amber-200/90 rounded-3xl p-6 md:p-8 shadow-sm text-center overflow-hidden">
        {/* Soft whimsical decorative elements */}
        {/* Cloud top-left */}
        <div className="absolute top-2 left-3 opacity-30 pointer-events-none">
          <svg width="38" height="24" viewBox="0 0 38 24" fill="#FDE68A">
            <path d="M12 20h18a6 6 0 0 0 0-12 7.5 7.5 0 0 0-14.7-2A6 6 0 0 0 12 20z" />
          </svg>
        </div>

        {/* Little star top-right */}
        <div className="absolute top-3 right-4 opacity-40 pointer-events-none">
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-300 animate-pulse" />
        </div>

        {/* Bubble bottom-right */}
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-pink-100/40 rounded-full blur-xs pointer-events-none" />

        {/* Tier / Phase Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100/80 border border-amber-300/70 text-xs font-bold text-amber-900 mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{level.tierName.split('·')[0].trim()}</span>
          {isTiered && currentPhase && (
            <>
              <span className="text-amber-400">/</span>
              <span className="text-amber-800">{currentPhase.phaseTitle}</span>
            </>
          )}
        </div>

        {/* Header Title */}
        <div className="flex items-center justify-center gap-1 text-xs md:text-sm font-bold text-amber-700/80 tracking-wider mb-1">
          <span>✨ 把这句话拼出来！ ✨</span>
        </div>

        {/* Target Chinese Sentence */}
        <div className="relative my-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-wide leading-relaxed font-sans drop-shadow-xs">
            「{displayChinese}」
          </h1>
        </div>

        {/* If Tiered mode: Show Phase Switcher */}
        {isTiered && level.tieredAssembly && (
          <div className="mt-3 pt-3 border-t border-amber-200/60">
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 mb-2">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>长难句分层组装模式 (逐步击破从句与短语)：</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {level.tieredAssembly.phases.map((phase, idx) => {
                const isActive = idx === currentPhaseIndex;
                return (
                  <button
                    key={phase.id}
                    onClick={() => onSelectPhase && onSelectPhase(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-400 text-amber-950 shadow-sm border border-amber-500'
                        : 'bg-white/80 hover:bg-white text-slate-600 border border-amber-200'
                    }`}
                  >
                    {phase.phaseTitle}
                  </button>
                );
              })}
            </div>
            {currentPhase && (
              <p className="text-xs text-amber-800/90 mt-2 font-medium">
                💡 {currentPhase.phaseDesc}
              </p>
            )}
          </div>
        )}

        {/* Optional Hint trigger */}
        {onShowHint && (
          <div className="mt-1">
            <button
              onClick={onShowHint}
              className="inline-flex items-center gap-1 text-xs text-amber-700/80 hover:text-amber-900 font-semibold transition-colors py-0.5 px-2 rounded-md hover:bg-amber-100/50"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>看语法提示</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
