import { MimiChat } from './MimiChat';
import React from 'react';
import { createPortal } from 'react-dom';
import { LevelData, WordBlock } from '../types/game';
import { EvaluationResult } from '../utils/translationEvaluator';
import type { InsertSide } from '../utils/railState';
import { DressedCat, type CatPose, type CatExpression } from './DressedCat';
import { CatId, OutfitSlot } from '../data/catShop';
import { CandyWordBlock } from './CandyWordBlock';
import { sound } from '../utils/sound';
import { formatTime } from '../utils/timing';
import { stageForLevel } from '../utils/stages';
import { Lightbulb, CheckCircle2, RotateCcw, Volume2, Sparkles, Heart } from 'lucide-react';

interface MainStudyBoardProps {
  studyActive?: boolean;
  level: LevelData;
  onOpenCloud: () => void;
  activeCat?: CatId;
  catOutfit?: Partial<Record<OutfitSlot,string>>;
  catPose?: CatPose;
  catExpression?: CatExpression;
  challengeStarted?: boolean;
  challengeElapsedMs?: number;
  challengeFinished?: boolean;
  currentPhaseIndex?: number;
  slottedWords: (WordBlock|null)[];
  candidateWords: WordBlock[];
  expectedCount: number;
  matchedSlots: boolean[];
  matchedCount: number;
  isCorrect: boolean;
  isWobbling: boolean;
  evaluation: EvaluationResult;
  timeRoast?: boolean;
  onWordClick: (word: WordBlock) => void;
  onRemoveWord: (index: number) => void;
  onMoveWord: (from: number, to: number, side?: InsertSide) => void;
  onWordInfo: (word: WordBlock, e: React.MouseEvent) => void;
  onDropWordToSlot: (targetIndex: number, candidateId?: string, side?: InsertSide) => void;
  onClearAll: () => void;
  onShuffle: () => void;
  onCheckSentence: () => void;
  onShowHint: () => void;
  onDragStartWord: (e: React.DragEvent, word: WordBlock) => void;
}

export const MainStudyBoard: React.FC<MainStudyBoardProps> = ({
  studyActive = true,
  level,
  onOpenCloud,
  activeCat = 'mimi',
  catOutfit = {},
  catPose = 'peek',
  catExpression = 'smile',
  challengeStarted = false,
  challengeElapsedMs = 0,
  challengeFinished = false,
  currentPhaseIndex = 0,
  slottedWords,
  candidateWords,
  expectedCount,
  matchedSlots,
  matchedCount,
  isCorrect,
  isWobbling,
  evaluation,
  timeRoast = false,
  onWordClick,
  onRemoveWord,
  onMoveWord,
  onWordInfo,
  onDropWordToSlot,
  onClearAll,
  onShuffle,
  onCheckSentence,
  onShowHint,
  onDragStartWord,
}) => {
  // Drag hover uses DOM attributes only; no React state changes on dragover.
  // An insertion marker shows exactly which side of a word will accept the drop.
  const hoveredSlotRef = React.useRef<{el: HTMLElement; side: InsertSide | 'empty'} | null>(null);
  const clearHover = () => {
    if (hoveredSlotRef.current) {
      hoveredSlotRef.current.el.removeAttribute('data-drag-hover');
      hoveredSlotRef.current.el.removeAttribute('data-insert-side');
      hoveredSlotRef.current = null;
    }
  };
  const highlightSlot = (el: HTMLElement | null, side: InsertSide | 'empty') => {
    if (hoveredSlotRef.current?.el === el && hoveredSlotRef.current?.side === side) return;
    clearHover();
    if (!el) return;
    el.setAttribute('data-drag-hover', 'true');
    if (side !== 'empty') el.setAttribute('data-insert-side', side);
    hoveredSlotRef.current = {el, side};
  };
  const [challengeBubble, setChallengeBubble] = React.useState(false);
  const [showElapsedOnTap, setShowElapsedOnTap] = React.useState(false);
  React.useEffect(() => {
    if (!challengeStarted || challengeFinished) { setChallengeBubble(false); setShowElapsedOnTap(false); return; }
    setChallengeBubble(true);
    const t = window.setTimeout(() => setChallengeBubble(false), 3200);
    return () => window.clearTimeout(t);
  }, [challengeStarted, challengeFinished]);
  React.useEffect(() => {
    if (!showElapsedOnTap) return;
    const t = window.setTimeout(() => setShowElapsedOnTap(false), 3200);
    return () => window.clearTimeout(t);
  }, [showElapsedOnTap]);
  const [companionPosition, setCompanionPosition] = React.useState<{x:number,y:number}|null>(null);
  const companionRef = React.useRef<HTMLDivElement>(null);
  const catHitRef = React.useRef<HTMLDivElement>(null);
  const companionDrag = React.useRef<{pointerId:number,x:number,y:number,startX:number,startY:number,moved:boolean,originCat:boolean}|null>(null);
  const clampCompanion = React.useCallback((x:number,y:number) => {
    const width = companionRef.current?.getBoundingClientRect().width || 350;
    const height = companionRef.current?.getBoundingClientRect().height || 110;
    return {x:Math.max(0,Math.min(Math.max(0,window.innerWidth-width),x)),
      y:Math.max(0,Math.min(Math.max(0,window.innerHeight-height),y))};
  }, []);
  React.useEffect(() => {
    const keepVisible = () => setCompanionPosition(prev => prev ? clampCompanion(prev.x,prev.y) : null);
    window.addEventListener('resize',keepVisible);
    const observer=new ResizeObserver(keepVisible);
    if(companionRef.current)observer.observe(companionRef.current);
    return () => {window.removeEventListener('resize',keepVisible);observer.disconnect();};
  },[clampCompanion]);
  const beginCompanionDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    companionDrag.current = {pointerId:e.pointerId,x:e.clientX,y:e.clientY,startX:rect.left,startY:rect.top,moved:false,originCat:!!catHitRef.current?.contains(e.target as Node)};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveCompanion = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag=companionDrag.current;
    if (!drag || drag.pointerId!==e.pointerId) return;
    if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>5) drag.moved=true;
    if(drag.moved) setCompanionPosition(clampCompanion(drag.startX+e.clientX-drag.x,drag.startY+e.clientY-drag.y));
  };
  const endCompanionDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = companionDrag.current;
    if (drag?.pointerId !== e.pointerId) return;
    const rect = catHitRef.current?.getBoundingClientRect();
    // Pointer capture happens on the whole floating translator; a click on the cat
    // must therefore be detected from coordinates, not a bubbling onClick target.
    if (!drag.moved && drag.originCat && rect && e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) { sound.playSlot('mimi_happy'); if (challengeStarted && !challengeFinished) setShowElapsedOnTap(true); window.dispatchEvent(new Event('englishblocks-open-mimi')); }
    if(e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    companionDrag.current=null;
  };

  const [selectedPos, setSelectedPos] = React.useState('全部');
  const posGroups = React.useMemo(() => {
    const categories = ['名词','动词','形容词','副词','代词','限定词 / 冠词','介词','连词','其他 / 待核对'];
    const groups = new Map<string, WordBlock[]>();
    for (const category of categories) groups.set(category, []);
    for (const word of candidateWords) {
      const pos = (word.pos || '').toLowerCase();
      let category = '其他 / 待核对';
      if (/^(n\.|noun|名词)/.test(pos)) category = '名词';
      else if (/^(v\.|verb|modal|aux|动词)/.test(pos)) category = '动词';
      else if (/^(adj\.|adjective|形容词)/.test(pos)) category = '形容词';
      else if (/^(adv\.|adverb|副词)/.test(pos)) category = '副词';
      else if (/^(pron\.|pronoun|代词)/.test(pos)) category = '代词';
      else if (/^(det\.|art\.|determiner|article|限定词|冠词)/.test(pos)) category = '限定词 / 冠词';
      else if (/^(prep\.|preposition|介词)/.test(pos)) category = '介词';
      else if (/^(conj\.|conjunction|连词)/.test(pos)) category = '连词';
      groups.get(category)!.push(word);
    }
    return [...groups].filter(([,words]) => words.length);
  }, [candidateWords]);
  const slotCount = expectedCount;
  const hasAnyWord = slottedWords.some(Boolean);
  const shouldRoast = slottedWords.length > 0 && slottedWords.every(Boolean) && !evaluation.isCorrect && Boolean(evaluation.comment?.trim());

  const isTiered = Boolean(level.tieredAssembly && level.tieredAssembly.phases.length > 0);
  const currentPhase = isTiered ? level.tieredAssembly!.phases[currentPhaseIndex] : null;
  const displayChinese = currentPhase ? currentPhase.targetChinese : level.targetChinese;


  const handleReadAssembled = () => {
    if (evaluation.currentText.trim()) {
      sound.speakText(evaluation.currentText);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', `slot:${index}`);
    sound.playPop(1.1);
  };

  type DropTarget = {index: number; side: InsertSide | 'empty'; element: HTMLElement | null};

  // One delegated listener for the entire track. No nested drop handlers,
  // no dragover-triggered React render, and no changes to layout while dragging.
  const locateDrop = (e: React.DragEvent<HTMLDivElement>): DropTarget => {
    const rail = e.currentTarget;
    const slots = Array.from(rail.querySelectorAll<HTMLElement>('[data-rail-slot]'));
    if (!slots.length) return {index: -1, side: 'empty', element: null};
    const direct = (e.target instanceof Element ? e.target : rail).closest<HTMLElement>('[data-rail-slot]');
    let element: HTMLElement;
    if (direct && rail.contains(direct)) {
      element = direct;
    } else {
      let distance = Infinity;
      element = slots[0];
      for (const candidate of slots) {
        const r = candidate.getBoundingClientRect();
        const x = Math.max(r.left, Math.min(e.clientX, r.right));
        const y = Math.max(r.top, Math.min(e.clientY, r.bottom));
        const d = (e.clientX - x) ** 2 + (e.clientY - y) ** 2;
        if (d < distance) {distance = d; element = candidate;}
      }
    }
    const index = Number(element.dataset.railSlot);
    if (!Number.isInteger(index) || index < 0 || index >= expectedCount) {
      return {index: -1, side: 'empty', element: null};
    }
    if (!slottedWords[index]) return {index, side: 'empty', element};
    const rect = element.getBoundingClientRect();
    return {index, side: e.clientX <= rect.left + rect.width / 2 ? 'before' : 'after', element};
  };

  const onRailDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const {side, element} = locateDrop(e);
    highlightSlot(element, side);
  };

  const handleRailDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const {index, side} = locateDrop(e);
    const data = e.dataTransfer.getData('text/plain');
    clearHover();
    if (index < 0 || index >= expectedCount) return;
    const insertSide: InsertSide = side === 'empty' ? 'before' : side;
    if (data.startsWith('slot:')) {
      const fromIndex = Number(data.slice(5));
      if (Number.isInteger(fromIndex) && fromIndex >= 0 && fromIndex < expectedCount &&
          fromIndex !== index && slottedWords[fromIndex]) {
        onMoveWord(fromIndex, index, insertSide);
        sound.playSnap();
      }
    } else if (data.startsWith('candidate:')) {
      const id = data.slice('candidate:'.length);
      if (!candidateWords.some(word => word.id === id)) return;
      onDropWordToSlot(index, id, insertSide);
      sound.playSnap();
    }
  };

  const renderCandidates = (words: WordBlock[]) => (
    <div className="eb-candidates flex flex-wrap items-center justify-center gap-2 py-1 min-h-[40px] rounded-2xl" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); const data=e.dataTransfer.getData('text/plain'); if(data.startsWith('slot:')){const i=Number(data.slice(5));if(Number.isInteger(i))onRemoveWord(i);} clearHover();}}>
      {              words.map((word) => (
                <CandyWordBlock
                  key={word.id}
                  block={word}
                  onBlockClick={(b) => {
                    onWordClick(b);
                    sound.playPop(1.15);
                  }}
                  onInfoClick={(b, e) => onWordInfo(b, e)}
                  onDragEnd={clearHover}
                  onDragStart={(e, b) => {
                    e.dataTransfer.setData('text/plain', `candidate:${b.id}`);
                    onDragStartWord(e, b);
                    sound.playPop(1);
                  }}
                />
              ))}
    </div>
  );
  return (
    <div className="relative w-full">
      {/* Central Learning Board Card (Matching Screenshot) */}
      <div
        className={`
          eb-board-card relative bg-[#FCFAF2]/95 backdrop-blur-md rounded-[28px] p-4 md:p-5 border border-white/90 shadow-sm
          transition-all duration-300
          ${isCorrect ? 'ring-2 ring-[#7BD399]/40' : ''}
        `}
      >
        {/* TOP RIGHT: 咪咪陪伴 (Mimi Peeking Over the Border) */}
        {studyActive&&createPortal(<div ref={companionRef} className="eb-floating-cat fixed flex items-end gap-2 z-[60] cursor-grab active:cursor-grabbing select-none max-w-[min(94vw,450px)] touch-none"
          style={companionPosition ? {left:companionPosition.x,top:companionPosition.y, right:'auto'} : {right:24,top:88}}
          onPointerDown={beginCompanionDrag}
          onPointerMove={moveCompanion}
          onPointerUp={endCompanionDrag}
          onPointerCancel={endCompanionDrag}
          title="按住拖动萌宠，可放到屏幕任意位置">
          {/* Mimi Cat Character Illustration */}
          <div ref={catHitRef} className="relative cursor-pointer" role="button" tabIndex={0} aria-label="点击小猫打开咪咪对话" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.dispatchEvent(new Event('englishblocks-open-mimi'));}}}>
            <DressedCat
              cat={activeCat}
              emotion={isCorrect ? 'celebrating' : evaluation.emotion}
              items={catOutfit}
              pose={catPose}
              expression={isCorrect ? 'proud' : catExpression}
              size={96}
              className="hover:scale-105 active:scale-95 transition-transform"
            />
            <span className="block mx-auto mt-1 w-fit rounded-full border border-[#C8D8BA] bg-[#FFFDF7] px-2 py-1 text-[11px] font-bold text-[#4E7954]">问咪咪 ♡</span>
          </div>

          <MimiChat key={`${level.id}:${currentPhaseIndex}`} level={level} phase={currentPhaseIndex} slots={slottedWords} matches={matchedSlots} correct={evaluation.isCorrect || isCorrect} onLogin={onOpenCloud}
            fallback={showElapsedOnTap ? `已经挑战 ${formatTime(challengeElapsedMs)} 啦！` : challengeBubble ? '计时开始啦！我悄悄帮你记着。' : isCorrect ? '太棒啦！这一关也被你拿下了！' : timeRoast ? '五分钟啦！慢慢想，我陪你。' : shouldRoast ? evaluation.comment : ''} />
        </div>, document.body)}

        {/* 1. TOP CATEGORY BADGE */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E8F2E4] border border-[#CDE1C7] text-[#426637] text-xs font-semibold">
            <span>🍃</span>
            <span>{stageForLevel(level).label} · {stageForLevel(level).subtitle}</span>
          </div>
        </div>

        {/* 2. CHINESE TARGET SENTENCE */}
        <div data-eb-edit="target" className="text-center my-3">
          <h2 className="eb-target-title font-target text-2xl md:text-3xl text-[#242921] font-medium tracking-wide leading-relaxed">
            {displayChinese}
          </h2>

          {/* Delicate Botanical Vine Divider (Matching Screenshot) */}
          <div className="flex items-center justify-center gap-3 my-3 text-[#A4B69E] opacity-75 select-none">
            <span className="w-12 h-[1px] bg-[#C9D6C4]" />
            <span className="text-xs tracking-widest font-serif">🌿 ❀ 🌿</span>
            <span className="w-12 h-[1px] bg-[#C9D6C4]" />
          </div>
        </div>

        {/* 3. SENTENCE ASSEMBLY RAIL */}
        <div data-eb-edit="rail" className="eb-board-section mt-1 mb-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#576352] mb-1 px-1">
            <div className="flex items-center gap-1.5">
              <span>🍃</span>
              <span>句子组装轨道</span>
              <span className="text-[#8C9886] font-normal">
                ({slottedWords.filter(Boolean).length} / {expectedCount} 词)
              </span>
              <span className="rounded-full border border-[#BDDAC2] bg-[#E7F4E8] text-[#37664A] px-2.5 py-0.5 text-[11px] font-bold" aria-live="polite">
                ✓ 对位 {matchedCount} / {expectedCount}
              </span>
            </div>

            {slottedWords.some(Boolean) && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-[#8C9886] hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                title="清空组装轨道"
              >
                <RotateCcw className="w-3 h-3" />
                <span>清空轨道</span>
              </button>
            )}
          </div>

          {/* Slots Track Container (Matching Screenshot rounded pills) */}
          <div className="eb-rail flex flex-wrap items-center gap-1.5 min-h-[42px] p-1.5 bg-white/40 rounded-[28px] border border-[#E5E1D5]"
            onDragOver={onRailDragOver}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) clearHover(); }}
            onDrop={handleRailDrop}>
            {Array.from({ length: slotCount }).map((_, index) => {
              const word = slottedWords[index];

              if (word) {
                return (
                  <div
                    key={`slotted-${word.id}-${index}`}
                    data-rail-slot={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={clearHover}
                    className="inline-flex items-center rounded-full rail-word-slot"
                    title={matchedSlots[index] ? "这个词的位置正确" : undefined}
                  >
                    <CandyWordBlock
                      draggable={false}
                      block={word}
                      isSlotted
                      isCorrect={isCorrect || matchedSlots[index]}
                      isWobbling={isWobbling}
                      onBlockClick={() => {
                        onRemoveWord(index);
                        sound.playPop(0.9);
                      }}
                      onInfoClick={(b, e) => onWordInfo(b, e)}
                    />
                  </div>
                );
              }

              // Empty Slot (Dashed pill)
              return (
                <div
                  key={`empty-slot-${index}`}
                  data-rail-slot={index}
                  className={`
                    h-8 min-w-[48px] md:min-w-[56px] px-2 rounded-full flex items-center justify-center
                    slot-pill-empty transition-all duration-150
                  `}
                >
                  <span className="text-[11px] font-candy text-[#A8B5A3]">
                    {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="eb-rail-instructions hidden text-[11px] text-[#92A08D] mt-2 px-1 select-none">
            拖到词块左侧／右侧可插入，其他词块会自动让位 · 放到空格可自由落位 · 点击词块可退回
          </p>
        </div>

        {/* 4. CANDIDATE WORD BANK */}
        <div data-eb-edit="bank" className="eb-board-section mb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#576352] mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <span>🍃</span>
              <span>待选词块库</span>
            </div>
            <button
              onClick={onShuffle}
              className="text-[11px] text-[#7A8A74] hover:text-[#3B4D36] font-medium transition-colors cursor-pointer"
              title="打乱待选词顺序"
            >
              重新排列
            </button>
          </div>

          {/* A single compact bank: POS tabs filter, rather than stacking one full row per POS. */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2" role="group" aria-label="按词性筛选词块">
            {(['全部', ...posGroups.map(([name]) => name)]).map(name => (
              <button key={name} type="button" onClick={() => setSelectedPos(name)}
                aria-pressed={selectedPos === name}
                className={`rounded-full px-2.5 py-1 text-[11px] border transition-colors ${selectedPos === name ? 'bg-[#789D6C] border-[#789D6C] text-white' : 'bg-white/65 border-[#DEE8D7] text-[#63775D] hover:bg-[#EAF3E5]'}`}>
                {name}{name !== '全部' ? ` ${posGroups.find(([category]) => category === name)?.[1].length ?? 0}` : ` ${candidateWords.length}`}
              </button>
            ))}
          </div>
          <div className="eb-word-bank-scroll max-h-[min(30vh,260px)] min-h-[72px] overflow-y-auto overscroll-contain rounded-2xl border border-[#E7EBDD] bg-white/25 p-2">
            {candidateWords.length === 0
              ? <div className="text-center py-3 text-xs text-[#8A9884]">所有词块均已填入轨道！</div>
              : renderCandidates(selectedPos === '全部' ? candidateWords : (posGroups.find(([name]) => name === selectedPos)?.[1] ?? candidateWords))}
          </div>
          <p className="eb-bank-instructions text-[10px] text-[#91A08A] mt-1 px-1">点击词性筛选；「全部」可查看所有待选词块。长句可滚动页面继续查看。</p>
        </div>

        {/* 5. BOTTOM ACTION CONTROLS (提示 + 检查句子) */}
        <div data-eb-edit="actions" className="eb-board-actions flex items-center justify-center gap-3 pt-2">
          {/* Hint Button (Matching Screenshot) */}
          <button
            onClick={onShowHint}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#FFFDF4] hover:bg-white active:scale-95 border border-[#E4DBC8] text-[#756A54] font-medium text-sm shadow-2xs transition-all cursor-pointer"
            title="查看语法结构提示"
          >
            <Lightbulb className="w-4 h-4 text-[#D9A74A] fill-[#FDE68A]" />
            <span>提示</span>
          </button>

          {/* Check Sentence Button */}
          <button
            onClick={onCheckSentence}
            disabled={slottedWords.filter(Boolean).length < expectedCount || isCorrect}
            className={`
              flex items-center gap-2 px-7 py-2.5 rounded-full font-medium text-sm shadow-sm transition-all cursor-pointer
              ${
                slottedWords.filter(Boolean).length >= expectedCount && !isCorrect
                  ? 'bg-[#789D6C] hover:bg-[#688E5C] active:scale-95 text-white shadow-sm'
                  : 'bg-[#EAE6DA] text-[#A6A090] cursor-not-allowed border border-[#DFD9CA]'
              }
            `}
            title={slottedWords.filter(Boolean).length >= expectedCount ? '点击检查句子' : '请先填满句子轨道'}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>检查句子</span>
          </button>
        </div>
      </div>
    </div>
  );
};
