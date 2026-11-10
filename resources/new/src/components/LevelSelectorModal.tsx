import { ModalOverlay } from './ModalOverlay';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SENTENCE_BANK } from '../data/sentenceBank';
import { LEARNING_STAGES, stageForLevel } from '../utils/stages';
import { StageEmblem } from './StageEmblem';
import { X, CheckCircle2, BookOpenText, MapPinned, Sparkles, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface LevelSelectorModalProps {
  isOpen: boolean;
  currentLevelId: number;
  completedLevelIds: number[];
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}
const PAGE_SIZE = 24;
export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({isOpen, currentLevelId, completedLevelIds, onSelectLevel, onClose}) => {
  const current = SENTENCE_BANK.find(l => l.id === currentLevelId) ?? SENTENCE_BANK[0];
  const currentStage = stageForLevel(current);
  const [selectedTier, setSelectedTier] = useState<number>(current.tier);
  const [page, setPage] = useState(0);
  const currentTile = useRef<HTMLButtonElement|null>(null);
  const scrollArea = useRef<HTMLDivElement|null>(null);
  const completed = useMemo(()=>new Set(completedLevelIds), [completedLevelIds]);
  const allInStage = useMemo(()=>SENTENCE_BANK.filter(level => level.tier===selectedTier),[selectedTier]);
  const shown = useMemo(()=>allInStage.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[allInStage,page]);
  const pages = Math.max(1,Math.ceil(allInStage.length/PAGE_SIZE));
  useEffect(()=>{if(isOpen){
    setSelectedTier(current.tier);
    const stageLevels=SENTENCE_BANK.filter(l=>l.tier===current.tier);
    const idx=stageLevels.findIndex(l=>l.id===currentLevelId);
    setPage(Math.floor(Math.max(0,idx)/PAGE_SIZE));
  }},[isOpen,currentLevelId,current.tier]);
  useEffect(()=>{if(isOpen && currentTile.current){ const area=scrollArea.current; if(area){const tile=currentTile.current.getBoundingClientRect();const bounds=area.getBoundingClientRect();if(tile.bottom>bounds.bottom)area.scrollTop+=tile.bottom-bounds.bottom+12;else if(tile.top<bounds.top)area.scrollTop-=bounds.top-tile.top+12;}}},[isOpen,selectedTier,page]);
  if(!isOpen)return null;
  const currentStageTotal=SENTENCE_BANK.filter(l=>l.tier===currentStage.tier);
  const currentStageCompleted=currentStageTotal.filter(l=>completed.has(l.id)).length;
  const currentPercent=currentStageTotal.length?Math.round(currentStageCompleted/currentStageTotal.length*100):0;
  return <ModalOverlay className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-[#253B2E]/45 backdrop-blur-[3px] animate-fade-in" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section role="dialog" aria-modal="true" aria-label="关卡目录" className="eb-modal-panel eb-modal-levels relative w-full max-w-[960px] max-h-[92vh] flex flex-col min-h-0 overflow-hidden rounded-[34px] border-[5px] border-[#FFF9E9] bg-[#FFFCF5] shadow-[0_32px_90px_rgba(29,56,37,.25)]">
      <header className="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b border-[#E9E7D9] bg-white/70 shrink-0">
        <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-[#EAF3E5] border border-[#D5E6C9] text-[#65946A] grid place-items-center"><MapPinned className="w-6 h-6"/></div><div><h2 className="text-xl font-bold tracking-wide text-[#35513D]">学习路径总览</h2><p className="text-[11px] text-[#879083]">英语拼块 · 从基础句型到高阶长难句</p></div></div>
        <button aria-label="关闭关卡目录" onClick={onClose} className="h-9 w-9 rounded-full grid place-items-center bg-[#F2F5ED] text-[#657862] hover:bg-[#E3EEDC]"><X className="w-5 h-5"/></button>
      </header>
      <div ref={scrollArea} className="eb-modal-body eb-levels-body overflow-y-auto min-h-0 flex-1 p-4 sm:p-7 space-y-5">
        <div className="eb-levels-summary rounded-[26px] border border-[#D7E5D2] bg-gradient-to-r from-[#E8F4E6] via-[#F6FAEE] to-[#FFF5E0] px-5 py-5 sm:py-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-8 -top-10 h-32 w-32 bg-white/35 rounded-full pointer-events-none"/>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div><span className="inline-flex rounded-full bg-white/85 text-[#4B7656] border border-[#CFE5CF] text-[11px] font-bold px-3 py-1">正在学习 · {currentStage.label}</span><h3 className="text-2xl font-bold text-[#335A42] mt-2">LEVEL {current.levelNumber} <span className="text-base text-[#86A48A] font-normal">/ {SENTENCE_BANK.length}</span></h3><p className="text-sm text-[#6C826D] mt-1">{currentStage.subtitle} · 已自动定位到当前关卡</p></div>
            <div className="rounded-2xl border border-[#DDE8D8] bg-white/90 px-5 py-3 min-w-[178px] shadow-sm"><p className="text-xs text-[#7A957E]">本阶段已通关</p><div className="mt-1 text-xl font-bold text-[#4F805D]">{currentStageCompleted} <span className="text-sm text-[#9BB59C]">/ {currentStageTotal.length}</span></div><div className="h-2 bg-[#E9EDE4] rounded-full mt-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#7FAF83] to-[#B3CCA4] rounded-full" style={{width:`${currentPercent}%`}}/></div></div>
          </div>
        </div>
        <div><div className="flex items-center justify-between mb-3"><h3 className="font-bold text-[#3B5540] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#D9AE66]"/> 四大学习阶段</h3><span className="text-[11px] text-[#8DA084]">选择阶段查看关卡</span></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{LEARNING_STAGES.map(stage=>{const lvls=SENTENCE_BANK.filter(l=>l.tier===stage.tier);const count=lvls.filter(l=>completed.has(l.id)).length;const active=selectedTier===stage.tier;return <button key={stage.tier} onClick={()=>{setSelectedTier(stage.tier);setPage(0);}} aria-pressed={active} className={`stage-card stage-card-${stage.tone} text-left rounded-[22px] p-3 sm:p-4 border-2 transition-transform hover:-translate-y-0.5 ${active?'stage-card-selected shadow-md':'shadow-sm'}`}>
            <div className="eb-stage-heading flex items-center gap-2"><StageEmblem tier={stage.tier} size={32}/><div className="min-w-0"><div className="font-bold text-[13px] text-[#3E533F]">{stage.label}</div><div className="text-[10px] text-[#788575]">{stage.subtitle}</div></div></div>
            <div className="flex justify-between items-center mt-2 text-[10px] font-medium text-[#647866]"><span>{count} / {lvls.length} 关</span><span>{lvls.length?Math.round(count/lvls.length*100):0}%</span></div><div className="h-1.5 rounded-full bg-white/75 overflow-hidden mt-1"><div className="h-full rounded-full bg-[#7FAF86]" style={{width:`${lvls.length?count/lvls.length*100:0}%`}}/></div>
          </button>})}</div>
        </div>
        <div className="eb-level-map rounded-[24px] bg-white/85 border border-[#E4E7D9] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h3 className="font-bold text-[#3E5841] flex items-center gap-2"><BookOpenText className="w-5 h-5 text-[#80A88C]"/>{LEARNING_STAGES.find(s=>s.tier===selectedTier)?.label} · 关卡地图</h3><p className="text-[11px] text-[#8A9A89] mt-1">深绿色是当前关卡，浅绿色代表已通关</p></div><span className="text-xs text-[#758B77]">{allInStage.length} 个关卡</span></div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">{shown.map(level=>{const active=level.id===currentLevelId,done=completed.has(level.id);return <button key={level.id} ref={active?currentTile:undefined} onClick={()=>{onSelectLevel(level.id);onClose();}} title={level.targetChinese} aria-current={active?'step':undefined} className={`level-map-node group rounded-2xl min-h-[44px] flex flex-col items-center justify-center border text-center transition-all hover:-translate-y-0.5 ${active?'border-[#4B9062] bg-[#548E69] text-white shadow-md ring-2 ring-[#A9D6AE]':' '+(done?'border-[#BEDBC4] bg-[#EDF7EA] text-[#557E5E]':'border-[#E4E6DF] bg-[#FBFCF8] text-[#98A39B] hover:border-[#B3D2B7]')}`}><span className="text-[11px] font-bold">{level.levelNumber}</span>{active?<span className="text-[10px] font-semibold mt-0.5">进行中</span>:done?<CheckCircle2 className="w-4 h-4 mt-1"/>:<span className="text-[10px] mt-0.5">待挑战</span>}</button>})}</div>
          {pages>1&&<div className="flex items-center justify-center gap-4 mt-5 text-xs font-semibold text-[#6D836E]"><button disabled={page===0} onClick={()=>setPage(i=>i-1)} className="inline-flex items-center gap-1 disabled:opacity-35 hover:text-[#3C6744]"><ChevronLeft className="w-4 h-4"/> 上一组</button><span>{page+1} / {pages}</span><button disabled={page===pages-1} onClick={()=>setPage(i=>i+1)} className="inline-flex items-center gap-1 disabled:opacity-35 hover:text-[#3C6744]">下一组 <ChevronRight className="w-4 h-4"/></button></div>}
        </div>
      </div>
      <footer className="shrink-0 px-5 py-3 border-t border-[#E8E8DC] bg-white/85 flex items-center justify-between text-xs text-[#859083]"><span>已完成 {completedLevelIds.length} 关 · 当前 LEVEL {current.levelNumber}</span><button onClick={()=>{onSelectLevel(currentLevelId);onClose();}} className="rounded-full bg-[#6E9B75] hover:bg-[#5E8C65] text-white font-bold px-4 py-2 flex items-center gap-1">回到当前关卡 <ArrowRight className="w-3.5 h-3.5"/></button></footer>
    </section>
  </ModalOverlay>;
};
