import {PlayerAvatar} from './PlayerAvatar';
import React from 'react';
import { UserProfile } from '../types/game';
import { LEARNING_STAGES } from '../utils/stages';
import { BrandLogo } from './BrandLogo';
import { StageEmblem } from './StageEmblem';
import { BookOpenText, BarChart3, Music2, Settings2, Shirt, ChevronRight, Sparkles, Heart } from 'lucide-react';

interface LeftSidebarProps {
  profile: UserProfile;
  currentTier: number;
  currentLevelNumber: number;
  onSelectTier: (tier: number) => void;
  onOpenLevelSelector: () => void;
  onOpenStats: () => void;
  onOpenBgmStudio: () => void;
  onOpenSettings: () => void;
  onOpenFriends: () => void;
  onOpenWardrobe: () => void;
  activeCat: 'mimi' | 'tuanzhang';
  onSelectCat: (cat: 'mimi' | 'tuanzhang') => void;
  className?: string;
}
export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  profile, currentTier, currentLevelNumber, onSelectTier, onOpenLevelSelector, onOpenStats, onOpenBgmStudio, onOpenSettings, onOpenFriends, onOpenWardrobe, activeCat, onSelectCat, className='',
}) => {
  const navItems = [
    {label: '好友小窝', note: '一起学习，偶尔调皮', Icon: Heart, action: onOpenFriends, tone:'mint'},
    {label: '咪咪衣柜', note: '把猫咪打扮得漂漂亮亮', Icon: Shirt, action: onOpenWardrobe, tone:'rose'},
    {label: '关卡目录', note: '你的学习地图', Icon: BookOpenText, action: onOpenLevelSelector, tone:'mint'},
    {label: '学习统计', note: '记录每一点进步', Icon: BarChart3, action: onOpenStats, tone:'sky'},
    {label: '音效工作室', note: '打造专属学习氛围', Icon: Music2, action: onOpenBgmStudio, tone:'honey'},
    {label: '系统设置', note: '存档与偏好', Icon: Settings2, action: onOpenSettings, tone:'violet'},
  ] as const;
  return <aside className={`w-[244px] shrink-0 sidebar-shell rounded-[25px] px-3 py-3 border border-[var(--theme-border)] shadow-[0_12px_35px_rgb(var(--theme-shadow-rgb)/.09)] flex-col select-none ${className}`}>
    <div>
      <div className="flex gap-2 items-center px-1 pb-2 border-b border-[var(--theme-border)]"><BrandLogo size={46}/><div><h1 className="font-bold text-base tracking-widest text-[var(--theme-text)]">英语拼块</h1><p className="text-[10px] text-[var(--theme-muted)] tracking-[.08em]">WORD BLOCK GARDEN</p></div></div>
      <button onClick={onOpenStats} className="w-full text-left flex items-center gap-2 py-2 px-1 rounded-2xl hover:bg-white/80 transition-colors" title="查看我的学习档案">
        <span className="h-9 w-9 shrink-0 rounded-[18px] bg-gradient-to-br from-[var(--theme-muted-surface)] to-[var(--theme-muted-surface)] border-[2px] border-white shadow-sm overflow-hidden grid place-items-center"><PlayerAvatar avatar={profile.avatar} size={36} label="学习头像"/></span>
        <span className="flex-1 min-w-0"><span className="flex items-center gap-1 font-bold text-[13px] truncate text-[var(--theme-text)]">{profile.name||'学习者'} <ChevronRight className="w-3.5 h-3.5 text-[var(--theme-muted)]"/></span><span className="block text-[11px] text-[var(--theme-muted)] mt-0.5">{LEARNING_STAGES.find(s=>s.tier===currentTier)?.label} · LEVEL {currentLevelNumber}</span></span>
      </button>
      <p className="text-[10px] font-bold text-[var(--theme-muted)] px-2 pt-1 pb-1 tracking-widest">我的小屋 · MENU</p>
      <nav className="flex flex-col gap-0.5">{navItems.map(({label,note,Icon,action,tone})=><button key={label} onClick={action} className="group w-full flex items-center gap-2 px-2 py-1.5 rounded-[17px] text-left hover:bg-white shadow-none hover:shadow-sm border border-transparent hover:border-[var(--theme-border)] active:scale-[.98] transition-all"><span className={`nav-icon nav-icon-${tone} rounded-[11px] h-8 w-8 grid place-items-center shrink-0`}><Icon className="w-[18px] h-[18px]"/></span><span className="min-w-0 flex-1"><span className="block font-bold text-[12px] text-[var(--theme-text)]">{label}</span><span className="block text-[9px] text-[var(--theme-muted)] mt-0 truncate">{note}</span></span><ChevronRight className="h-3.5 w-3.5 text-[var(--theme-muted)] group-hover:translate-x-0.5 transition-transform"/></button>)}</nav>
      <div className="border-t border-[var(--theme-border)] mt-2 pt-2"><p className="text-[10px] font-bold text-[var(--theme-muted)] tracking-wider px-2 mb-1">我的学习阶段</p><div className="space-y-0.5">{LEARNING_STAGES.map(stage=><button key={stage.tier} onClick={()=>stage.tier===currentTier?onOpenLevelSelector():onSelectTier(stage.tier)} className={`w-full px-2 py-1 rounded-[11px] flex items-center gap-2 text-xs text-left ${currentTier===stage.tier?'bg-[var(--theme-muted-surface)] text-[var(--theme-text)] font-bold border border-[var(--theme-border)]':'text-[var(--theme-muted)] hover:bg-white/80 border border-transparent'}`}><StageEmblem tier={stage.tier} size={24}/><span className="flex-1">{stage.label}</span>{currentTier===stage.tier&&<span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-primary)]"/>}</button>)}</div></div>
      <div className="border-t border-[var(--theme-border)] mt-2 pt-2"><div className="flex gap-2">{(['mimi','tuanzhang'] as const).map(cat=><button key={cat} onClick={()=>onSelectCat(cat)} aria-pressed={activeCat===cat} className={`flex-1 rounded-[13px] px-2 py-1 border-2 transition-all ${activeCat===cat?'border-[var(--theme-border)] bg-[var(--theme-muted-surface)] shadow-sm':'border-[var(--theme-border)] bg-white/65 hover:border-[var(--theme-border)]'}`}><img src={cat==='mimi'?'./assets/mimi-golden.png':'./assets/tuanzhang-silver.png'} className="mx-auto w-9 h-9 object-contain" alt={cat==='mimi'?'咪咪':'团长'}/><span className="block text-center text-[11px] font-bold text-[var(--theme-muted)]">{cat==='mimi'?'咪咪':'团长'}</span></button>)}</div></div>
    </div>

  </aside>;
};
