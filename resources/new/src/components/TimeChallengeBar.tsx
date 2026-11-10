import React from 'react';
import { Clock3, Trophy, Zap, TimerReset } from 'lucide-react';
import { SPEED_MILESTONES, formatTime } from '../utils/timing';

interface Props {
  elapsedMs: number;
  active: boolean;
  started: boolean;
  finished: boolean;
  bestMs?: number;
  overtime: boolean;
}

/** Compact time-trial ribbon matching the approved cream/mint UI mockup. */
export function TimeChallengeBar({elapsedMs,active,started,finished,bestMs,overtime}:Props) {
  const currentBonus = started ? (SPEED_MILESTONES.find(m => elapsedMs <= m.maxMs)?.bonus ?? 0) : 6;
  return <><div className="eb-timer-mini" aria-label="本关计时挑战">
    <Clock3 className="w-3.5 h-3.5"/><span>{formatTime(elapsedMs)}</span>
    <span className="eb-timer-mini-best">最佳 {bestMs === undefined ? '--:--' : formatTime(bestMs)}</span>
  </div><section aria-label="本关计时挑战" className="rounded-[24px] border border-[#DFE8D7] bg-gradient-to-r from-[#FFFDF5]/95 via-[#EFF6E7]/95 to-[#FFF4E3]/95 px-3.5 py-3 shadow-[0_4px_17px_rgba(73,102,70,.06)] flex flex-wrap items-center gap-3 sm:gap-5">
    <div className="flex items-center gap-3 shrink-0">
      <span className={`h-11 w-11 rounded-2xl grid place-items-center border border-white shadow-sm ${active?'bg-[#D9EED8] text-[#48845F]':'bg-[#F3F0E3] text-[#91A18B]'}`}>
        {active ? <Clock3 className="w-5 h-5"/> : <TimerReset className="w-5 h-5"/>}
      </span>
      <div className="min-w-[88px]"><div className="text-[10px] font-bold tracking-wider text-[#849681]">本关计时挑战</div><div className={`text-[24px] font-bold timer-clock-digit leading-tight ${overtime?'text-[#B88468]':'text-[#3D6950]'}`} aria-live="off">{formatTime(elapsedMs)}</div></div>
    </div>
    <div className="flex-1 min-w-[175px]">
      <div className="flex flex-wrap gap-1.5 mb-1.5">{SPEED_MILESTONES.map((m,i)=><span key={m.maxMs} className={`timer-milestone rounded-full border px-2 py-1 text-[10px] font-bold ${elapsedMs>m.maxMs&&started?'border-[#E6E6DF] bg-[#F2F1EC] text-[#ACB4A8]':'border-[#CEE0C9] bg-white/90 text-[#5A8366]'}`}>{m.maxMs / 60000} 分钟内 +{m.bonus}</span>)}</div>
      <div className="text-[11px] text-[#7D8C77]">{!started?'放入第一个词块，计时开始':finished?'完成啦！本关成绩已存入学习档案':!active?'已暂停 · 回来继续挑战':overtime?'超过五分钟啦，咪咪已经在偷偷计时':'保持节奏，向更快的自己发起挑战'}</div>
    </div>
    <div className="flex flex-col gap-1 items-end text-[11px] text-[#6E8B73] font-semibold shrink-0">
      <span className="inline-flex items-center gap-1 bg-[#E3F1E4] rounded-full px-2.5 py-1"><Zap className="w-3.5 h-3.5"/> 当前速度档 +{currentBonus}</span>
      <span className="inline-flex items-center gap-1"><Trophy className="w-3 h-3 text-[#D2AC67]"/> 最佳：{bestMs===undefined?'等待首次挑战':formatTime(bestMs)}</span>
    </div>
  </section></>;
}
