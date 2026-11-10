import React from 'react';
import { WordBlock } from '../types/game';
import { CandyWordBlock } from './CandyWordBlock';
import { Shuffle, CheckCircle2, RotateCcw } from 'lucide-react';
import { sound } from '../utils/sound';

interface CandidateBankProps {
  candidateWords: WordBlock[];
  onWordClick: (word: WordBlock) => void;
  onWordInfo: (word: WordBlock, e: React.MouseEvent) => void;
  onShuffle: () => void;
  onReset: () => void;
  onCheckSentence: () => void;
  canCheck: boolean;
  onDragStartWord: (e: React.DragEvent, word: WordBlock) => void;
}

export const CandidateBank: React.FC<CandidateBankProps> = ({
  candidateWords,
  onWordClick,
  onWordInfo,
  onShuffle,
  onReset,
  onCheckSentence,
  canCheck,
  onDragStartWord,
}) => {
  const handleShuffleClick = () => {
    sound.playShuffle();
    onShuffle();
  };

  const handleDragStart = (e: React.DragEvent, word: WordBlock) => {
    e.dataTransfer.setData('text/plain', `candidate:${word.id}`);
    onDragStartWord(e, word);
    sound.playPop(1);
  };

  return (
    <div className="w-full">
      {/* Candidate Words Pool Container */}
      <div className="bg-[#FAF7F0] border-2 border-amber-200/80 rounded-3xl p-5 md:p-6 shadow-sm mb-3.5 min-h-[130px] flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs md:text-sm font-bold text-slate-500 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>待选词块库</span>
            <span className="text-slate-400 font-normal">
              ({candidateWords.length} 块可用)
            </span>
          </div>
          <span className="text-[11px] text-slate-600">
            点击词块放入上方轨道 · 点击 ? 查看释义
          </span>
        </div>

        {/* Word Blocks Bank (Flex wrap with adaptive sizes) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 py-2">
          {candidateWords.length === 0 ? (
            <div className="text-center py-4 text-xs font-semibold text-slate-600">
              所有词块均已进入轨道！点击下方「检查句子」检验成果吧！
            </div>
          ) : (
            candidateWords.map((word) => (
              <CandyWordBlock
                key={word.id}
                block={word}
                onBlockClick={(b) => {
                  onWordClick(b);
                  sound.playPop(1.15);
                }}
                onInfoClick={(b, e) => onWordInfo(b, e)}
                onDragStart={(e, b) => handleDragStart(e, b)}
              />
            ))
          )}
        </div>

        {/* Small sub-tip */}
        <div className="text-center text-[10px] text-slate-600 pt-1">
          💡 查看释义零惩罚 · 随意探索词序
        </div>
      </div>

      {/* Primary Action Buttons Bar */}
      <div className="grid grid-cols-2 gap-3">
        {/* Shuffle Button */}
        <button
          onClick={handleShuffleClick}
          className="py-3 px-4 rounded-2xl bg-white hover:bg-amber-50 active:scale-95 border-2 border-amber-200 text-slate-700 font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition-all candy-btn"
          title="打乱待选词块顺序"
        >
          <Shuffle className="w-4 h-4 text-amber-600 stroke-[2.5]" />
          <span>重新排列</span>
        </button>

        {/* Check Sentence Button */}
        <button
          onClick={onCheckSentence}
          disabled={!canCheck}
          className={`
            py-3 px-4 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-md transition-all
            ${
              canCheck
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-amber-950 shadow-amber-400/30 candy-btn cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
            }
          `}
          title={canCheck ? '点击检查拼句是否正确' : '请先将词块填满轨道'}
        >
          <CheckCircle2 className={`w-5 h-5 ${canCheck ? 'text-amber-900' : 'text-slate-400'} stroke-[2.5]`} />
          <span>检查句子</span>
        </button>
      </div>
    </div>
  );
};
