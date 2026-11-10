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
  return <aside className={`w-[244px] shrink-0 sidebar-shell rounded-[25px] px-3 py-3 border border-[#E4E7D8] shadow-[0_12px_35px_rgba(72,96,61,.09)] flex-col select-none ${className}`}>
    <div>
      <div className="flex gap-2 items-center px-1 pb-2 border-b border-[#E6E6D8]"><BrandLogo size={46}/><div><h1 className="font-bold text-base tracking-widest text-[#38543D]">英语拼块</h1><p className="text-[10px] text-[#899685] tracking-[.08em]">WORD BLOCK GARDEN</p></div></div>
      <button onClick={onOpenStats} className="w-full text-left flex items-center gap-2 py-2 px-1 rounded-2xl hover:bg-white/80 transition-colors" title="查看我的学习档案">
        <span className="h-9 w-9 shrink-0 rounded-[18px] bg-gradient-to-br from-[#F8E9C8] to-[#E3F0DF] border-[2px] border-white shadow-sm overflow-hidden grid place-items-center"><img src="./assets/mimi-golden.png" alt="学习头像" className="h-full w-full object-contain"/></span>
        <span className="flex-1 min-w-0"><span className="flex items-center gap-1 font-bold text-[13px] truncate text-[#39513E]">{profile.name||'学习者'} <ChevronRight className="w-3.5 h-3.5 text-[#9BA99A]"/></span><span className="block text-[11px] text-[#849581] mt-0.5">{LEARNING_STAGES.find(s=>s.tier===currentTier)?.label} · LEVEL {currentLevelNumber}</span></span>
      </button>
      <p className="text-[10px] font-bold text-[#9CA899] px-2 pt-1 pb-1 tracking-widest">我的小屋 · MENU</p>
      <nav className="flex flex-col gap-0.5">{navItems.map(({label,note,Icon,action,tone})=><button key={label} onClick={action} className="group w-full flex items-center gap-2 px-2 py-1.5 rounded-[17px] text-left hover:bg-white shadow-none hover:shadow-sm border border-transparent hover:border-[#E3E9D9] active:scale-[.98] transition-all"><span className={`nav-icon nav-icon-${tone} rounded-[11px] h-8 w-8 grid place-items-center shrink-0`}><Icon className="w-[18px] h-[18px]"/></span><span className="min-w-0 flex-1"><span className="block font-bold text-[12px] text-[#526351]">{label}</span><span className="block text-[9px] text-[#A0AA97] mt-0 truncate">{note}</span></span><ChevronRight className="h-3.5 w-3.5 text-[#A4B3A3] group-hover:translate-x-0.5 transition-transform"/></button>)}</nav>
      <div className="border-t border-[#E8E8D9] mt-2 pt-2"><p className="text-[10px] font-bold text-[#9DAA9B] tracking-wider px-2 mb-1">我的学习阶段</p><div className="space-y-0.5">{LEARNING_STAGES.map(stage=><button key={stage.tier} onClick={()=>stage.tier===currentTier?onOpenLevelSelector():onSelectTier(stage.tier)} className={`w-full px-2 py-1 rounded-[11px] flex items-center gap-2 text-xs text-left ${currentTier===stage.tier?'bg-[#E7F3E6] text-[#4B7655] font-bold border border-[#D2E7D1]':'text-[#8B998A] hover:bg-white/80 border border-transparent'}`}><StageEmblem tier={stage.tier} size={24}/><span className="flex-1">{stage.label}</span>{currentTier===stage.tier&&<span className="h-1.5 w-1.5 rounded-full bg-[#56966D]"/>}</button>)}</div></div>
      <div className="border-t border-[#E8E8D9] mt-2 pt-2"><div className="flex gap-2">{(['mimi','tuanzhang'] as const).map(cat=><button key={cat} onClick={()=>onSelectCat(cat)} aria-pressed={activeCat===cat} className={`flex-1 rounded-[13px] px-2 py-1 border-2 transition-all ${activeCat===cat?'border-[#97BC95] bg-[#EDF6E9] shadow-sm':'border-[#EEEBDD] bg-white/65 hover:border-[#D3DAC7]'}`}><img src={cat==='mimi'?'./assets/mimi-golden.png':'./assets/tuanzhang-silver.png'} className="mx-auto w-9 h-9 object-contain" alt={cat==='mimi'?'咪咪':'团长'}/><span className="block text-center text-[11px] font-bold text-[#70816D]">{cat==='mimi'?'咪咪':'团长'}</span></button>)}</div></div>
    </div>

  </aside>;
};
