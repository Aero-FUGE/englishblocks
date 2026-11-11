import React, { useState } from 'react';
import { WordBlock } from '../types/game';
import { CandyWordBlock } from './CandyWordBlock';
import { ChevronLeft, ChevronRight, X, ArrowUpDown } from 'lucide-react';
import { sound } from '../utils/sound';

interface AssemblyRailProps {
  slottedWords: WordBlock[];
  totalExpectedCount: number;
  isCorrect?: boolean;
  isWobbling?: boolean;
  onRemoveWord: (index: number) => void;
  onMoveWord: (fromIndex: number, toIndex: number) => void;
  onWordInfo: (word: WordBlock, e: React.MouseEvent) => void;
  onDropWordToSlot: (targetIndex: number) => void;
  onClearAll: () => void;
}

export const AssemblyRail: React.FC<AssemblyRailProps> = ({
  slottedWords,
  totalExpectedCount,
  isCorrect = false,
  isWobbling = false,
  onRemoveWord,
  onMoveWord,
  onWordInfo,
  onDropWordToSlot,
  onClearAll,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Total slots to display: at least the total expected count (minimum 4)
  const slotCount = Math.max(totalExpectedCount, slottedWords.length, 4);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', `slot:${index}`);
    setDraggedIndex(index);
    sound.playPop(1.1);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    setDragOverIndex(null);

    if (data.startsWith('slot:')) {
      const fromIndex = parseInt(data.replace('slot:', ''), 10);
      if (!isNaN(fromIndex) && fromIndex !== targetIndex) {
        onMoveWord(fromIndex, Math.min(targetIndex, slottedWords.length - 1));
        sound.playSnap();
      }
    } else if (data.startsWith('candidate:')) {
      onDropWordToSlot(targetIndex);
      sound.playSnap();
    }
    setDraggedIndex(null);
  };

  // Quick swap adjacent buttons for fine-tuned ordering on mobile
  const handleMoveLeft = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      onMoveWord(index, index - 1);
      sound.playSnap();
    }
  };

  const handleMoveRight = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < slottedWords.length - 1) {
      onMoveWord(index, index + 1);
      sound.playSnap();
    }
  };

  return (
    <div className="w-full">
      {/* Rail Container */}
      <div
        className={`
          relative rounded-3xl p-5 md:p-6 transition-all duration-300
          ${
            isCorrect
              ? 'bg-emerald-50/80 border-3 border-emerald-300 shadow-md shadow-emerald-200/50'
              : 'bg-white/95 border-3 border-amber-200/80 shadow-md shadow-amber-900/5'
          }
        `}
      >
        {/* Subtle decorative rail track background line */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>句子组装轨道</span>
            <span className="text-slate-400 font-normal">
              ({slottedWords.length} / {totalExpectedCount} 词)
            </span>
          </div>

          {slottedWords.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-rose-50"
              title="一键移回所有词块"
            >
              <X className="w-3.5 h-3.5" />
              <span>清空轨道</span>
            </button>
          )}
        </div>

        {/* Word Slots & Slotted Word Blocks (wraps automatically for long sentences) */}
        <div className="flex flex-wrap items-center gap-2.5 min-h-[64px] p-2 bg-[var(--theme-muted-surface)] rounded-2xl border border-amber-100/70">
          {Array.from({ length: slotCount }).map((_, index) => {
            const word = slottedWords[index];
            const isTargetDrop = dragOverIndex === index;

            if (word) {
              return (
                <div
                  key={`slotted-${word.id}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative group inline-flex items-center transition-transform ${
                    isTargetDrop ? 'scale-105' : ''
                  }`}
                >
                  {/* The Word Block */}
                  <CandyWordBlock
                    block={word}
                    isSlotted
                    isCorrect={isCorrect}
                    isWobbling={isWobbling}
                    onBlockClick={() => {
                      onRemoveWord(index);
                      sound.playPop(0.85);
                    }}
                    onInfoClick={(b, e) => onWordInfo(b, e)}
                  />

                  {/* Micro hover/mobile order swap handles */}
                  {slottedWords.length > 1 && !isCorrect && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center bg-white border border-slate-200 rounded-full shadow-xs px-1 py-0.5 z-20">
                      {index > 0 && (
                        <button
                          onClick={(e) => handleMoveLeft(index, e)}
                          className="w-4 h-4 flex items-center justify-center hover:bg-slate-100 rounded-full"
                          title="向左插入"
                        >
                          <ChevronLeft className="w-3 h-3 text-slate-600" />
                        </button>
                      )}
                      {index < slottedWords.length - 1 && (
                        <button
                          onClick={(e) => handleMoveRight(index, e)}
                          className="w-4 h-4 flex items-center justify-center hover:bg-slate-100 rounded-full"
                          title="向右插入"
                        >
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Empty Slot
            return (
              <div
                key={`empty-slot-${index}`}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  h-11 min-w-[70px] md:min-w-[84px] px-3 rounded-2xl flex items-center justify-center
                  slot-empty transition-all duration-150
                  ${isTargetDrop ? 'border-amber-400 bg-amber-50 scale-102' : 'border-dashed border-amber-200/90'}
                `}
              >
                <span className="text-[11px] font-candy font-bold text-amber-300">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Small tip footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 px-1">
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            <span>点击词块移回词库 · 拖动可插入排序</span>
          </div>
          {slottedWords.length === 0 && (
            <span className="text-amber-700 font-semibold">请在下方挑选词块放入</span>
          )}
        </div>
      </div>
    </div>
  );
};
