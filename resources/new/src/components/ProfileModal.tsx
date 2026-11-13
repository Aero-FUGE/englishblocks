import {PlayerAvatar} from './PlayerAvatar';
import {AvatarPicker} from './AvatarPicker';
import { ModalOverlay } from './ModalOverlay';
import React, { useState } from 'react';
import { UserProfile, WordBlock, LevelData } from '../types/game';
import { SENTENCE_BANK } from '../data/sentenceBank';
import { X, Volume2, Star, RotateCcw, BookOpen, Layers, CheckCircle, Flame } from 'lucide-react';
import { sound } from '../utils/sound';
import { LEARNING_STAGES, stageForLevel } from '../utils/stages';
import { formatTime } from '../utils/timing';
import { Clock3, Trophy, TimerReset } from 'lucide-react';
import { StageEmblem } from './StageEmblem';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  wordsMasteredCount: number;
  totalWordsGoal: number;
  onUpdateAvatar: (id:string)=>void;
  onUpdateProfileName: (newName: string) => void;
  onJumpToLevel: (levelId: number) => void;
  currentLevel: LevelData;
  fishCount: number;
  onOpenTasks:()=>void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  wordsMasteredCount,
  totalWordsGoal,
  onUpdateAvatar,
  onUpdateProfileName,
  onJumpToLevel,
  currentLevel,
  fishCount,
  onOpenTasks,
}) => {
  const [avatarOpen,setAvatarOpen]=useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'mistakes' | 'starred'>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  if (!isOpen) return null;

  // Collect all starred words across sentence bank
  const starredWords: WordBlock[] = [];
  SENTENCE_BANK.forEach((level) => {
    level.words.forEach((w) => {
      if (profile.starredWordIds.includes(w.id)) {
        if (!starredWords.some((sw) => sw.cleanWord === w.cleanWord)) {
          starredWords.push(w);
        }
      }
    });
  });

  const accuracyPercent =
    profile.totalAttempts > 0
      ? Math.round((profile.correctAttempts / profile.totalAttempts) * 100)
      : 100;

  const timedRecords = Object.entries(profile.timingRecords ?? {}).filter(([,r]) => typeof r?.bestMs === 'number');
  const fastestRecord = timedRecords.length ? timedRecords.reduce((best, pair) => pair[1].bestMs! < best[1].bestMs! ? pair : best) : null;
  const solvedTimedCount = timedRecords.length;
  const currentBest = profile.timingRecords?.[String(currentLevel.id)]?.bestMs;

  const remainingWords = Math.max(0, totalWordsGoal - wordsMasteredCount);
  const remainingSentences = Math.max(0, profile.totalSentenceGoal - profile.completedLevelIds.length);

  const handleStartEditName = () => {
    setEditNameValue(profile.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (editNameValue.trim()) {
      onUpdateProfileName(editNameValue.trim());
    }
    setIsEditingName(false);
  };

  return (
    <>
    {avatarOpen&&<AvatarPicker value={profile.avatar} onSelect={onUpdateAvatar} onClose={()=>setAvatarOpen(false)}/>}
    <ModalOverlay className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[var(--theme-text)]/45 backdrop-blur-[3px] animate-fade-in">
      <div role="dialog" aria-modal="true" aria-label="学习档案" className="eb-modal-panel eb-modal-profile relative w-full max-w-2xl bg-[var(--theme-surface)] rounded-[34px] p-5 sm:p-7 shadow-[0_27px_75px_rgb(var(--theme-shadow-rgb)/.24)] border-[5px] border-[var(--theme-border)] z-10 flex flex-col max-h-[90vh] animate-scale-up">
        {/* Learning profile: same mint/cream visual language as the stage map. */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-3"><span className="h-10 w-10 rounded-2xl bg-[var(--theme-muted-surface)] text-[var(--theme-muted)] grid place-items-center text-xl">✦</span><div><h3 className="text-xl font-bold text-[var(--theme-text)]">学习档案</h3><p className="text-[11px] text-[var(--theme-muted)]">英语拼块 · 记录你的每一步成长</p></div></div>
          <button onClick={onClose} aria-label="关闭" className="w-9 h-9 rounded-full bg-white hover:bg-[var(--theme-muted-surface)] text-[var(--theme-muted)] grid place-items-center border border-[var(--theme-border)]"><X className="w-4 h-4"/></button>
        </div>
        <div className="eb-modal-body"><div className="relative my-4 rounded-[26px] border border-[var(--theme-border)] bg-gradient-to-r from-[var(--theme-muted-surface)] via-[var(--theme-muted-surface)] to-[var(--theme-muted-surface)] p-4 sm:p-5 overflow-hidden">
          <div className="absolute top-[-42px] right-[-32px] w-40 h-40 rounded-full bg-white/35 pointer-events-none"/>
          <div className="relative flex flex-wrap items-center gap-3 sm:gap-4">
            <button type="button" className="eb-profile-avatar-edit" aria-label="修改头像" onClick={()=>setAvatarOpen(true)}><PlayerAvatar avatar={profile.avatar} size={80} label="我的头像"/><span>修改头像</span></button>
            <div className="flex-1 min-w-[160px]">
              <p className="text-[10px] tracking-widest text-[var(--theme-muted)] font-bold">MY LITTLE LEARNING GARDEN</p>
              {isEditingName ? <div className="flex items-center gap-2 mt-1"><input type="text" autoFocus maxLength={12} value={editNameValue} onChange={e=>setEditNameValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSaveName();}} className="w-full max-w-[190px] bg-white rounded-xl border-2 border-[var(--theme-border)] px-3 py-2 outline-none text-sm font-bold text-[var(--theme-text)]"/><button onClick={handleSaveName} className="px-3 py-2 bg-[var(--theme-primary)] text-white font-bold rounded-xl text-xs">保存</button></div>
              : <div className="flex items-center gap-2 mt-1"><h4 className="font-bold text-xl text-[var(--theme-text)] truncate">{profile.name}</h4><button onClick={handleStartEditName} className="text-[11px] rounded-full border border-[var(--theme-border)] px-2 py-1 bg-white/90 text-[var(--theme-muted)] font-bold hover:bg-white">✎ 修改</button></div>}
              <div className="mt-2 flex flex-wrap gap-1.5"><span className="px-2.5 py-1 rounded-full bg-white/85 text-[11px] font-bold text-[var(--theme-text)]">{stageForLevel(currentLevel).label}</span><span className="px-2.5 py-1 rounded-full bg-[var(--theme-primary)] text-[11px] font-bold text-white">LEVEL {currentLevel.levelNumber}</span></div>
            </div>
            <div className="rounded-2xl border border-[var(--theme-border)] bg-white/90 px-3 py-2 text-right shadow-sm"><div className="text-[10px] text-[var(--theme-muted)]">小鱼干余额</div><div className="font-bold text-xl text-[var(--theme-muted)]">🐟 {fishCount}</div></div>
          </div>
          <div className="relative mt-4 border-t border-[var(--theme-border)] pt-3"><p className="text-[11px] text-[var(--theme-muted)] font-bold mb-2">成长路线</p><div className="flex gap-1.5">{LEARNING_STAGES.map(stage=><div key={stage.tier} className={`flex-1 text-center px-1 py-2 rounded-xl text-[10px] sm:text-xs font-semibold ${currentLevel.tier===stage.tier?'bg-[var(--theme-primary)] text-white shadow-sm':'bg-white/70 text-[var(--theme-muted)]'}`}><div className="flex justify-center mb-1"><StageEmblem tier={stage.tier} size={36}/></div>{stage.label}</div>)}</div></div>
        </div>
        {/* Mini Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-3">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            背词与拼句进度
          </button>
          <button
            onClick={() => setActiveTab('mistakes')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'mistakes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            错题小本 ({profile.mistakeHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('starred')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'starred'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            生词本 ({starredWords.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="pr-1">
          {activeTab === 'profile' && (<button className="eb-task-profile-link" onClick={onOpenTasks}><span>🏆 每日挑战 · 卷王悬赏</span><span>查看每日进度 →</span></button>)}
          {activeTab === 'profile' && (
            <div className="space-y-3">
              <div className="rounded-[22px] border border-[var(--theme-border)] bg-gradient-to-r from-[var(--theme-muted-surface)] to-[var(--theme-muted-surface)] p-4">
                <div className="mb-3 flex items-center gap-2 text-[var(--theme-text)] font-bold text-sm"><Trophy className="w-4 h-4 text-[var(--theme-muted)]"/> 计时挑战 · 个人纪录</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/85 rounded-xl p-2 text-center border border-white"><div className="flex justify-center mb-1 text-[var(--theme-muted)]"><Clock3 className="w-4 h-4"/></div><div className="text-base sm:text-lg font-bold text-[var(--theme-text)]">{currentBest === undefined ? '—' : formatTime(currentBest)}</div><div className="text-[10px] text-[var(--theme-muted)]">当前关最佳</div></div>
                  <div className="bg-white/85 rounded-xl p-2 text-center border border-white"><div className="flex justify-center mb-1 text-[var(--theme-muted)]"><Trophy className="w-4 h-4"/></div><div className="text-base sm:text-lg font-bold text-[var(--theme-text)]">{fastestRecord ? formatTime(fastestRecord[1].bestMs!) : '—'}</div><div className="text-[10px] text-[var(--theme-muted)]">全程最快单题</div></div>
                  <div className="bg-white/85 rounded-xl p-2 text-center border border-white"><div className="flex justify-center mb-1 text-[var(--theme-muted)]"><TimerReset className="w-4 h-4"/></div><div className="text-base sm:text-lg font-bold text-[var(--theme-muted)]">{solvedTimedCount}</div><div className="text-[10px] text-[var(--theme-muted)]">有成绩的关卡</div></div>
                </div>
                <p className="mt-2 text-[10px] text-[var(--theme-muted)]">独立拼出的最佳成绩会永久保存；完整答案不计入竞速榜。</p>
              </div>
              {/* Prominent Word Progress Box */}
              <div className="p-4 bg-[var(--theme-muted-surface)] rounded-[22px] border border-[var(--theme-border)]">
                <div className="flex items-center gap-2 mb-2 font-bold text-amber-900 text-sm">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>单词背诵核心进度统计</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-2">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                    <div className="text-xl font-candy font-bold text-amber-600">
                      {wordsMasteredCount}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">已掌握单词</div>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                    <div className="text-xl font-candy font-bold text-slate-700">
                      {totalWordsGoal}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">总目标词汇量</div>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                    <div className="text-xl font-candy font-bold text-rose-500">
                      {remainingWords}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">还需背诵单词</div>
                  </div>
                </div>
                <div className="text-xs text-amber-800 font-medium text-center">
                  完成率：{Math.round((wordsMasteredCount / totalWordsGoal) * 100)}%
                </div>
              </div>

              {/* Sentence Progress & Accuracy Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center justify-center gap-1 text-emerald-800 text-xs font-bold mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>拼句进度</span>
                  </div>
                  <div className="text-xl font-candy font-bold text-emerald-600">
                    {profile.completedLevelIds.length} / {profile.totalSentenceGoal} 句
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    还剩 {remainingSentences} 句通关
                  </div>
                </div>

                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100">
                  <div className="text-xs font-bold text-sky-800 mb-1">通关准确率</div>
                  <div className="text-xl font-candy font-bold text-sky-600">
                    {accuracyPercent}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    总尝试 {profile.totalAttempts} 次
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] bg-white border border-[var(--theme-border)] p-3 text-xs text-[var(--theme-muted)] flex flex-wrap items-center gap-2">
                <span className="font-bold text-[var(--theme-text)]">正在学习</span>
                <span className="rounded-full bg-[var(--theme-muted-surface)] px-2.5 py-1 font-bold">{stageForLevel(currentLevel).label} · LEVEL {currentLevel.levelNumber}</span>
                <span className="text-[var(--theme-muted)]">下一步：拼出当前句子，向下一关前进</span>
              </div>
              {/* Sound & Speech Settings */}
              <div className="bg-[var(--theme-surface)] p-3 rounded-2xl border border-amber-100 space-y-2">
                <div className="text-xs font-bold text-slate-700">音效与语音设定</div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>糖果音效与角色叫声</span>
                  <button
                    onClick={() => {
                      sound.enabled = !sound.enabled;
                      profile.soundEnabled = sound.enabled;
                    }}
                    className={`px-3 py-1 rounded-full font-bold text-[11px] transition-colors ${
                      sound.enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sound.enabled ? '已开启' : '已静音'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>语音朗读 (TTS 纯正美音)</span>
                  <button
                    onClick={() => {
                      sound.setSpeechEnabled(!sound.speechEnabled);
                      profile.speechEnabled = sound.speechEnabled;
                    }}
                    className={`px-3 py-1 rounded-full font-bold text-[11px] transition-colors ${
                      sound.speechEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sound.speechEnabled ? '已开启' : '已关闭'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mistakes' && (
            <div className="space-y-2">
              {profile.mistakeHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400 stroke-1" />
                  太棒了！当前没有任何错题记录~
                </div>
              ) : (
                profile.mistakeHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-red-50/60 rounded-2xl border border-red-100 flex items-center justify-between gap-2"
                  >
                    <div className="text-left text-xs">
                      <div className="font-bold text-slate-800">{m.targetSentence}</div>
                      <div className="text-red-500 text-[11px] mt-0.5 line-through">
                        曾误拼：{m.wrongSentence}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onJumpToLevel(m.levelId);
                        onClose();
                      }}
                      className="shrink-0 flex items-center gap-1 text-[11px] px-2.5 py-1 bg-white hover:bg-amber-50 border border-amber-200 text-amber-900 rounded-xl font-bold shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-600" />
                      <span>重做</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'starred' && (
            <div className="space-y-2">
              {starredWords.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Star className="w-8 h-8 mx-auto mb-2 text-amber-300 stroke-1" />
                  点击单词上的「?」问号，即可将生词收藏到这里哦！
                </div>
              ) : (
                starredWords.map((word) => (
                  <div
                    key={word.id}
                    className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-candy text-base font-bold text-slate-800">
                        <span>{word.cleanWord}</span>
                        <span className="font-sans text-xs text-slate-400 font-normal">
                          {word.phonetic}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        <span className="text-amber-800 font-medium mr-1.5">{word.pos}</span>
                        <span>{word.translation}</span>
                      </div>
                    </div>
                    <button
                      data-ui-sound="off" onClick={() => sound.speakText(word.cleanWord)}
                      aria-label="发音"
                      className="w-7 h-7 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-900 flex items-center justify-center transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </ModalOverlay>
    </>
  );
};
