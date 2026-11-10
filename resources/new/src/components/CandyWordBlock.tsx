import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WordBlock } from '../types/game';
import { Volume2, HelpCircle } from 'lucide-react';
import { sound } from '../utils/sound';

interface CandyWordBlockProps {
  block: WordBlock;
  isSlotted?: boolean;
  isCorrect?: boolean;
  isWobbling?: boolean;
  onBlockClick?: (block: WordBlock) => void;
  onInfoClick?: (block: WordBlock, e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, block: WordBlock) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
  size?: 'normal' | 'large' | 'compact';
}

export const CandyWordBlock: React.FC<CandyWordBlockProps> = ({
  block,
  isSlotted = false,
  isCorrect = false,
  isWobbling = false,
  onBlockClick,
  onInfoClick,
  draggable = true,
  onDragStart,
  onDragEnd,
  className = '',
  size = 'normal',
}) => {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
  }, []);
  const draggingRef = useRef(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number; below: boolean } | null>(null);
  const showMeaning = (element: HTMLDivElement) => {
    if (draggingRef.current) return;
    updateTooltip(element);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setTooltipPosition(null), 6500);
  };
  const handleBlockTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onBlockClick) return;
    // Narrow/mobile layout: first tap displays meaning, second tap moves the block.
    // Delay only the first tap's tooltip so a fast double tap does not flash it.
    if (window.matchMedia('(max-width: 767px)').matches) {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
        setTooltipPosition(null);
        onBlockClick(block);
      } else {
        const element = e.currentTarget;
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          if (element.isConnected) showMeaning(element);
        }, 320);
      }
    } else {
      onBlockClick(block);
    }
  };
  useEffect(() => { const hide = () => { setTooltipPosition(null); if (tooltipTimer.current) clearTimeout(tooltipTimer.current); }; window.addEventListener('eb-word-drag-start', hide); window.addEventListener('dragstart', hide); window.addEventListener('drop', hide); return () => { window.removeEventListener('eb-word-drag-start', hide); window.removeEventListener('dragstart', hide); window.removeEventListener('drop', hide); }; }, []);
  const meaning = block.translation?.trim() || block.sentenceMeaning?.slice(0, 80) || '点击问号查看释义';
  const updateTooltip = (element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const width = Math.min(350, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12));
    const below = rect.top < 220;
    setTooltipPosition({ left, top: below ? rect.bottom + 10 : rect.top - 10, below });
  };

  const getThemeClass = () => {
    if (isCorrect) return 'word-pill-correct';
    switch (block.colorTheme) {
      case 'purple':
        return 'word-pill-purple';
      case 'green':
        return 'word-pill-green';
      case 'pink':
        return 'word-pill-peach';
      case 'blue':
        return 'word-pill-blue';
      case 'yellow':
      default:
        return 'word-pill-yellow';
    }
  };

  const handleSpeakerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.speakText(block.cleanWord);
  };

  const handleInfoBtn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInfoClick) {
      onInfoClick(block, e);
    }
  };

  return (
    <div
      data-word-block
      onMouseEnter={(e) => { if (!draggingRef.current && !window.matchMedia('(max-width: 767px)').matches) updateTooltip(e.currentTarget); }}
      onMouseLeave={() => { if (!window.matchMedia('(max-width: 767px)').matches) setTooltipPosition(null); }}
      onFocus={(e) => { if (!draggingRef.current && !window.matchMedia('(max-width: 767px)').matches) updateTooltip(e.currentTarget); }}
      onBlur={() => setTooltipPosition(null)}
      draggable={draggable}
      onDragStart={(e) => { draggingRef.current = true; setTooltipPosition(null); if (tooltipTimer.current) clearTimeout(tooltipTimer.current); if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; } window.dispatchEvent(new Event('eb-word-drag-start')); onDragStart?.(e, block); }}
      onDragEnd={(e) => { draggingRef.current = false; setTooltipPosition(null); onDragEnd?.(e); }}
      onClick={handleBlockTap}
      className={`
        group relative inline-flex items-center gap-2 select-none cursor-pointer
        rounded-2xl md:rounded-full px-2.5 py-1.5 transition-all duration-150 active:scale-95
        ${getThemeClass()}
        ${isWobbling ? 'animate-wobble' : ''}
        ${className}
      `}
      title={undefined}
    >
      {/* The tooltip is portaled to document.body, outside the clipped scrolling word bank. */}
      {tooltipPosition && createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[99999] w-[350px] max-w-[calc(100vw-24px)] rounded-2xl border border-[#DCE8D7] bg-[#FFFEF8] px-4 py-3 text-left shadow-[0_12px_32px_rgba(57,79,54,0.16)]"
          style={{ left: tooltipPosition.left, top: tooltipPosition.top, transform: tooltipPosition.below ? undefined : 'translateY(-100%)' }}
        >
          <div className="mb-2 text-[10px] font-bold tracking-[0.12em] text-[#86A17D]">小猫词典 · 核心语义</div>
          <div className="mb-1 text-sm font-bold text-[#405B42]">{block.text.replace(/[,.?!]+$/g, '')}</div>
          <div className="break-words whitespace-normal text-sm font-semibold leading-relaxed text-[#405B42]">{meaning}</div>
          {block.simpleEn && <div className="mt-2 border-t border-[#E6EDE0] pt-2 text-xs leading-relaxed text-[#607C76]">{block.simpleEn}</div>}
          {block.senseNotes && <div className="mt-2 border-t border-[#E6EDE0] pt-2 text-xs leading-relaxed text-[#71816D]">{block.senseNotes}</div>}
          {block.sentenceMeaning && <div className="mt-2 border-t border-[#E6EDE0] pt-2 text-xs leading-relaxed text-[#8A8F80]">{block.sentenceMeaning}</div>}
        </div>,
        document.body
      )}
      {/* Word Text (Italic Serif font matching screenshot) */}
      <span className="font-word text-sm md:text-base font-semibold tracking-wide leading-none pt-0.5">
        {block.text}
      </span>

      {/* Audio Icon (matching screenshot speaker beside word) */}
      <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleSpeakerClick}
          aria-label={`发音 ${block.cleanWord}`}
          className="w-4 h-4 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-transform cursor-pointer"
          title="点击听标准发音"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>

        {/* Small info trigger for word details */}
        <button
          type="button"
          onClick={handleInfoBtn}
          aria-label={`查看 ${block.cleanWord} 词义`}
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          title="查看中文释义"
        >
          <HelpCircle className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
