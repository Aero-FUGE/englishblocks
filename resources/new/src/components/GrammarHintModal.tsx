import { ModalOverlay } from './ModalOverlay';
import React from 'react';
import { LevelData } from '../types/game';
import { X, Lightbulb, Sparkles, Eye, CheckCircle2, Fish, ArrowRight } from 'lucide-react';
import { expectedSequence } from '../utils/answer';

interface GrammarHintModalProps {
  isOpen: boolean;
  level: LevelData;
  phaseIndex?: number;
  hintCount: number;
  answerRevealed: boolean;
  onMoreHint: () => void;
  onRevealAnswer: () => void;
  onFillAnswer: () => void;
  onClose: () => void;
}

export const GrammarHintModal: React.FC<GrammarHintModalProps> = ({
  isOpen, level, phaseIndex = 0, hintCount, answerRevealed, onMoreHint, onRevealAnswer, onFillAnswer, onClose,
}) => {
  if (!isOpen) return null;
  const words = expectedSequence(level, phaseIndex);
  const answer = words.join(' ');
  const guidance = [
    '先找出主语、谓语和宾语，观察时间、地点以及修饰成分。',
    level.grammarExplanation || '找一找句子的主干，再处理从句和修饰语。',
    `句子可以从「${words.slice(0, Math.min(3, words.length)).join(' ')}」开始。`,
    `前半句的顺序是：「${words.slice(0, Math.ceil(words.length / 2)).join(' ')}」……`,
  ];
  return (
    <ModalOverlay className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#26372A]/45 backdrop-blur-[3px] animate-fade-in" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <section role="dialog" aria-modal="true" aria-label="语法提示" className="eb-modal-panel eb-modal-hint relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-[30px] border-[5px] border-[#FFF9E7] bg-[#FFFCF4] p-5 md:p-6 shadow-[0_22px_65px_rgba(41,65,44,.23)]">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#EDE5D3]">
          <div className="flex items-center gap-2.5"><span className="rounded-2xl bg-[#FFF0C4] p-2"><Lightbulb className="w-5 h-5 text-[#B78931]" /></span><div><h3 className="font-bold text-lg text-[#38503B]">咪咪的语法提示</h3><p className="text-xs text-[#8C937B]">一点点拆开句子，慢慢来</p></div></div>
          <button onClick={onClose} aria-label="关闭提示" className="rounded-full w-8 h-8 grid place-items-center bg-white text-[#73856F] border border-[#E9E6D8] hover:bg-[#F5F0DF]"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center justify-between mt-4 mb-3 text-[12px] font-semibold text-[#687A64]"><span>提示解锁进度</span><span>{hintCount} / 3</span></div>
        <div className="flex gap-2 mb-4">{[1,2,3].map(step=><div key={step} className={`h-2 flex-1 rounded-full ${step<=hintCount?'bg-[#87B390]':'bg-[#E6E8DC]'}`}/>)}</div>
        <div className="rounded-2xl border border-[#E8DFC9] bg-[#FFF8E6] p-3 mb-3"><div className="text-[11px] text-[#8B7A52] font-bold mb-1">本关中文目标</div><div className="text-sm font-semibold text-[#384736] leading-relaxed">{level.targetChinese}</div></div>
        <div className="rounded-2xl border border-[#DDE8D7] bg-[#F3F8F0] p-4 mb-4">
          <div className="flex gap-2 items-center text-xs font-bold text-[#456F4D] mb-2"><Sparkles className="w-4 h-4"/> 结构点拨</div>
          <p className="text-sm text-[#485547] leading-relaxed whitespace-pre-wrap">{guidance[Math.min(3,hintCount)]}</p>
        </div>
        {answerRevealed ? (
          <div className="rounded-[22px] border-2 border-[#8BBE95] bg-[#EAF5E9] p-4 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-[#346A48] text-sm font-bold"><CheckCircle2 className="w-4 h-4"/> 完整答案已解锁</div>
            <p className="text-[#2E5539] text-lg font-semibold leading-relaxed font-word not-italic">{answer}</p>
            <p className="text-xs text-[#68806A] mt-2">本题不获得小鱼干奖励。可以参考答案继续自己拼，或者一键填入。</p>
            <button onClick={onFillAnswer} className="mt-3 w-full rounded-2xl py-2.5 bg-[#578D63] text-white font-bold text-sm hover:bg-[#477A54] flex items-center justify-center gap-2">按答案填入词块 <ArrowRight className="w-4 h-4" /></button>
          </div>
        ) : hintCount < 3 ? (
          <button onClick={onMoreHint} className="w-full rounded-2xl py-3 border border-[#E7CF91] bg-[#FFEFBE] text-[#83642C] font-bold text-sm hover:bg-[#FFE49E]">{['解锁第一条提示', '再深入提示一次', '揭示前半句词序'][hintCount]}<span className="ml-1 font-normal text-xs">（降低本题鱼干奖励）</span></button>
        ) : (
          <button onClick={onRevealAnswer} className="w-full rounded-2xl py-3 bg-[#E6F0E0] border border-[#8DB796] text-[#356044] font-bold text-sm hover:bg-[#D5E8D0] flex items-center justify-center gap-2"><Eye className="w-4 h-4"/> 直接查看完整答案 <span className="text-xs font-normal">（放弃本题小鱼干）</span></button>
        )}
        <button onClick={onClose} className="w-full mt-3 py-2.5 text-sm font-semibold text-[#71806C] hover:text-[#375742] flex items-center justify-center gap-2">{answerRevealed ? '我想自己再试试' : '继续自己拼'} <Fish className="w-3.5 h-3.5" /></button>
      </section>
    </ModalOverlay>
  );
};
