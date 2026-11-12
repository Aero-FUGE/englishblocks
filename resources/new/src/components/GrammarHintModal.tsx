import { ModalOverlay } from './ModalOverlay';
import React from 'react';
import { LevelData } from '../types/game';
import { X, Lightbulb, Sparkles, Eye, CheckCircle2, Fish, ArrowRight } from 'lucide-react';
import {phraseHints} from '../utils/phraseHints';
import { expectedSequence } from '../utils/answer';

interface GrammarHintModalProps {
  isOpen: boolean;
  level: LevelData;
  phaseIndex?: number;
  hintCount: number;
  feedback?:string;
  answerRevealed: boolean;
  onMoreHint: () => void;
  onRevealAnswer: () => void;
  onFillAnswer: () => void;
  onClose: () => void;
}

export const GrammarHintModal: React.FC<GrammarHintModalProps> = ({
  isOpen, level, phaseIndex = 0, hintCount, feedback, answerRevealed, onMoreHint, onRevealAnswer, onFillAnswer, onClose,
}) => {
  if (!isOpen) return null;
  const words = expectedSequence(level, phaseIndex);
  const answer = words.join(' ');
  const phrases=phraseHints(level,phaseIndex);
  const chinese=level.tieredAssembly?.phases[phaseIndex]?.targetChinese||level.targetChinese;
  return (
    <ModalOverlay className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[var(--theme-text)]/45 backdrop-blur-[3px] animate-fade-in" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <section role="dialog" aria-modal="true" aria-label="语法提示" className="eb-modal-panel eb-modal-hint relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-[30px] border-[5px] border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 md:p-6 shadow-[0_22px_65px_rgb(var(--theme-shadow-rgb)/.23)]">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5"><span className="rounded-2xl bg-[var(--theme-muted-surface)] p-2"><Lightbulb className="w-5 h-5 text-[var(--theme-muted)]" /></span><div><h3 className="font-bold text-lg text-[var(--theme-text)]">咪咪的语法提示</h3><p className="text-xs text-[var(--theme-muted)]">一点点拆开句子，慢慢来</p></div></div>
          <button onClick={onClose} aria-label="关闭提示" className="rounded-full w-8 h-8 grid place-items-center bg-white text-[var(--theme-muted)] border border-[var(--theme-border)] hover:bg-[var(--theme-muted-surface)]"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center justify-between mt-4 mb-3 text-[12px] font-semibold text-[var(--theme-muted)]"><span>提示解锁进度</span><span>{hintCount} / 3</span></div>
        <div className="flex gap-2 mb-4">{[1,2,3].map(step=><div key={step} className={`h-2 flex-1 rounded-full ${step<=hintCount?'bg-[var(--theme-primary)]':'bg-[var(--theme-muted-surface)]'}`}/>)}</div>
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] p-3 mb-3"><div className="text-[11px] text-[var(--theme-muted)] font-bold mb-1">本关中文目标</div><div className="text-sm font-semibold text-[var(--theme-text)] leading-relaxed">{chinese}</div></div>
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] p-4 mb-4">
          <div className="flex gap-2 items-center text-xs font-bold text-[var(--theme-text)] mb-2"><Sparkles className="w-4 h-4"/> 结构点拨</div>
          <p className="text-sm text-[var(--theme-text)] leading-relaxed whitespace-pre-wrap">{level.grammarExplanation||'先找句子的主干，再处理时间、地点和修饰语。'}</p>
        </div>
        <div className="eb-hint-phrases"><h4>本句词组 · 中文意思</h4>{phrases.length?<dl>{phrases.map(p=><div key={p.english}><dt>{p.english}</dt><dd>{p.meaning}</dd></div>)}</dl>:<p>本句没有单独列出的固定词组，可以结合上面的结构点拨和词块释义来拼。</p>}</div>
        {feedback&&<p role="status" className="eb-task-note">{feedback}</p>}
        {answerRevealed ? (
          <div className="rounded-[22px] border-2 border-[var(--theme-border-strong)] bg-[var(--theme-muted-surface)] p-4 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-[var(--theme-text)] text-sm font-bold"><CheckCircle2 className="w-4 h-4"/> 完整答案已解锁</div>
            <p className="text-[var(--theme-text)] text-lg font-semibold leading-relaxed font-word not-italic">{answer}</p>
            <p className="text-xs text-[var(--theme-muted)] mt-2">本题不获得小鱼干奖励。可以参考答案继续自己拼，或者一键填入。</p>
            <button onClick={onFillAnswer} className="mt-3 w-full rounded-2xl py-2.5 bg-[var(--theme-primary)] text-white font-bold text-sm hover:bg-[var(--theme-primary)] flex items-center justify-center gap-2">按答案填入词块 <ArrowRight className="w-4 h-4" /></button>
          </div>
        ) : hintCount < 3 ? (
          <button onClick={onMoreHint} className="w-full rounded-2xl py-3 border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] text-[var(--theme-text)] font-bold text-sm hover:bg-[var(--theme-muted-surface)]">{hintCount<2?'第二次提示 · 补入一个空格':'第三次提示 · 再补入一个空格'}<span className="ml-1 font-normal text-xs">（降低本题鱼干奖励）</span></button>
        ) : (
          <button onClick={onRevealAnswer} className="w-full rounded-2xl py-3 bg-[var(--theme-muted-surface)] border border-[var(--theme-border-strong)] text-[var(--theme-text)] font-bold text-sm hover:bg-[var(--theme-muted-surface)] flex items-center justify-center gap-2"><Eye className="w-4 h-4"/> 直接查看完整答案 <span className="text-xs font-normal">（放弃本题小鱼干）</span></button>
        )}
        {!answerRevealed&&<p className="eb-task-note">第二、三次提示各补一个尚未填写的位置，不会替换已填好的词块。若所需词块放错位置，会先把它移到正确空格。</p>}
        <button onClick={onClose} className="w-full mt-3 py-2.5 text-sm font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-text)] flex items-center justify-center gap-2">{answerRevealed ? '我想自己再试试' : '继续自己拼'} <Fish className="w-3.5 h-3.5" /></button>
      </section>
    </ModalOverlay>
  );
};
