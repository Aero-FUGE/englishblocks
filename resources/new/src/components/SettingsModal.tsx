import {DEFAULT_PLAYER_NAME} from '../utils/profileName';
import {PlayerAvatar} from './PlayerAvatar';
import {SeasonPicker} from './SeasonPicker';
import { ModalOverlay } from './ModalOverlay';
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/game';
import { X, User, Target, Volume2, RotateCcw, Check, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetProgress: () => void;
  onOpenCloud: () => void;
}



export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onResetProgress,
  onOpenCloud,
}) => {
  const [name, setName] = useState(profile.name);

  const [wordGoal, setWordGoal] = useState(profile.totalWordGoal || 2004);
  const [sentenceGoal, setSentenceGoal] = useState(profile.totalSentenceGoal || 1190);
  const [speechRate, setSpeechRate] = useState(sound.speechRate);
  const [speechGender, setSpeechGender] = useState<'male'|'female'>(sound.speechGender);
  const [speechVoiceId, setSpeechVoiceId] = useState(sound.speechVoiceId);
  const [speechVolume, setSpeechVolume] = useState(sound.speechVolume);
  const [autoRead, setAutoRead] = useState(sound.autoReadOnSuccess);
  const [speechEnabled, setSpeechEnabled] = useState(sound.speechEnabled);
  const [availableVoices, setAvailableVoices] = useState(sound.getAvailableEnglishVoices());
  useEffect(() => {
    if (!isOpen) return;
    const onVoices = () => setAvailableVoices(sound.getAvailableEnglishVoices());
    onVoices();
    sound.setSpeechVoiceListener(onVoices);
    return () => sound.setSpeechVoiceListener(null);
  }, [isOpen]);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateProfile({
      name: name.trim() || DEFAULT_PLAYER_NAME,
      totalWordGoal: Number(wordGoal) || 2004,
      totalSentenceGoal: Number(sentenceGoal) || 1190,
    });
    setIsSavedNotice(true);
    sound.playPop();
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 400);
  };

  const handleConfirmReset = () => {
    if (window.confirm('确定要重置当前的学习拼句进度与错题记录吗？（已导入的音频和音乐不受影响）')) {
      onResetProgress();
      onClose();
    }
  };

  return (
    <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div role="dialog" aria-modal="true" aria-label="系统设置" className="eb-modal-panel eb-modal-settings relative w-full max-w-lg bg-[var(--theme-surface)] rounded-[36px] p-6 md:p-8 shadow-2xl border-4 border-[var(--theme-border)] z-10 flex flex-col max-h-[88vh] animate-scale-up">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="font-candy text-xl font-bold text-[var(--theme-text)]">学习偏好与系统设置</h3>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                个性化配置您的学员档案、词汇目标与发音习惯
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="关闭"
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="eb-modal-body flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          <SeasonPicker/>
          <button type="button" onClick={onOpenCloud} className="w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] p-3 text-left text-sm font-bold text-[var(--theme-text)]">☁ 账号同步 · 手机电脑接着玩</button>
          {/* Section 1: User Profile & Avatar */}
          <div className="p-4 bg-white/90 rounded-2xl border border-[var(--theme-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-text)]">
              <User className="w-4 h-4 text-[var(--theme-text)]" />
              <span>学员昵称与专属头像</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入您的昵称"
                maxLength={12}
                className="flex-1 px-3 py-2 text-sm font-bold border border-[var(--theme-border)] rounded-xl outline-none focus:border-[var(--theme-border-strong)] bg-[var(--theme-muted-surface)]"
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-[var(--theme-muted-surface)] border border-[var(--theme-border)] p-3">
              <PlayerAvatar avatar={profile.avatar} size={80} label="我的头像" className="rounded-2xl"/>
              <div className="text-xs text-[var(--theme-muted)]">我的学习头像<br/>可在学习档案中更换</div>
            </div>
          </div>

          {/* Section 2: Goals & Targets */}
          <div className="p-4 bg-white/90 rounded-2xl border border-[var(--theme-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-text)]">
              <Target className="w-4 h-4 text-[var(--theme-text)]" />
              <span>学习目标指标设定</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-muted)] block mb-1">
                  考纲单词目标总量 (词)
                </label>
                <input
                  type="number"
                  value={wordGoal}
                  onChange={(e) => setWordGoal(Number(e.target.value))}
                  min={100}
                  max={5000}
                  className="w-full px-3 py-2 text-sm font-bold border border-[var(--theme-border)] rounded-xl outline-none focus:border-[var(--theme-border-strong)] bg-[var(--theme-muted-surface)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--theme-muted)] block mb-1">
                  拼句通关总目标 (句)
                </label>
                <input
                  type="number"
                  value={sentenceGoal}
                  onChange={(e) => setSentenceGoal(Number(e.target.value))}
                  min={10}
                  max={2000}
                  className="w-full px-3 py-2 text-sm font-bold border border-[var(--theme-border)] rounded-xl outline-none focus:border-[var(--theme-border-strong)] bg-[var(--theme-muted-surface)]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: independent spoken English preferences. */}
          <div className="p-4 bg-white/90 rounded-2xl border border-[var(--theme-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-text)]">
              <Volume2 className="w-4 h-4 text-[var(--theme-text)]" />
              <span>英语发音 · 男女声 / 语速</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['female','male'] as const).map(gender=>(
                <button key={gender} type="button" data-ui-sound="off"
                  onClick={()=>{sound.setSpeechGender(gender);setSpeechGender(gender);setSpeechVoiceId('');sound.speakText('Welcome to English Blocks!');}}
                  className={`rounded-xl border px-3 py-2 font-bold text-xs transition ${speechGender===gender?'bg-[var(--theme-primary)] border-[var(--theme-border-strong)] text-white':'bg-[var(--theme-muted-surface)] border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-muted-surface)]'}`}
                >{gender==='female'?'女声朗读':'男声朗读'}</button>
              ))}
            </div>
            <label className="block text-[11px] font-semibold text-[var(--theme-muted)]">
              <span className="mb-1 block">选择设备可用英语音色（可手动指定）</span>
              <select value={speechVoiceId} onChange={e=>{setSpeechVoiceId(e.target.value);sound.setSpeechVoice(e.target.value);sound.speakText('How are you today?');}}
                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-xs text-[var(--theme-text)]">
                <option value="">自动匹配{speechGender==='female'?'女声':'男声'}（优先本地）</option>
                {availableVoices.map(v=><option key={v.id} value={v.id}>{v.name} · {v.lang}{v.local?' · 本地':''}</option>)}
              </select>
            </label>
            <p className="text-[11px] text-[var(--theme-muted)] leading-relaxed">当前音色：{sound.getSelectedVoiceLabel()}。男女声按设备所安装音色匹配；若设备缺少对应音色，可以在上方选具体声音。</p>
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[var(--theme-text)]">
                <span>英语朗读音量</span>
                <span className="font-mono text-[var(--theme-muted)]">{Math.round(speechVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={speechVolume}
                onChange={(e)=>{
                  const next = Number(e.target.value);
                  setSpeechVolume(next);
                  sound.setSpeechVolume(next);
                }}
                className="w-full accent-[var(--theme-primary)] cursor-pointer h-2 rounded-lg bg-[var(--theme-muted-surface)]"
              />
            </div>
            <div className="flex items-center gap-2">
              {[0.8, 0.9, 1.0, 1.1].map((rate) => (
                <button key={rate} data-ui-sound="off" onClick={() => {
                    setSpeechRate(rate);sound.setSpeechRate(rate);sound.speakText('Hello, happy learning!');
                  }} className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${speechRate === rate ? 'bg-[var(--theme-primary)] text-white shadow-2xs' : 'bg-[var(--theme-muted-surface)] hover:bg-[var(--theme-muted-surface)] text-[var(--theme-text)] border border-[var(--theme-border)]'}`}>
                  {rate === 1.0 ? '1.0x 原速' : `${rate}x`}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl bg-[var(--theme-muted-surface)] border border-[var(--theme-border)] p-3 cursor-pointer">
              <span className="text-xs text-[var(--theme-text)] font-bold">开启英语语音朗读</span>
              <input type="checkbox" checked={speechEnabled} onChange={e=>{setSpeechEnabled(e.target.checked);sound.setSpeechEnabled(e.target.checked)}} className="w-4 h-4 accent-[var(--theme-primary)]" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl bg-[var(--theme-muted-surface)] border border-[var(--theme-border)] p-3 cursor-pointer">
              <span className="text-xs text-[var(--theme-text)] font-bold">拼句通关后自动朗读整句</span>
              <input type="checkbox" checked={autoRead} onChange={e=>{setAutoRead(e.target.checked);sound.setAutoReadOnSuccess(e.target.checked)}} className="w-4 h-4 accent-[var(--theme-primary)]" />
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--theme-muted)]">点单词旁的喇叭，也会使用选定音色和语速。</span>
              <button type="button" data-ui-sound="off" onClick={()=>sound.speakText('By the time we arrived, the concert had already begun.')}
                className="shrink-0 rounded-full bg-[var(--theme-muted-surface)] border border-[var(--theme-border)] text-[var(--theme-text)] font-bold text-xs px-3 py-1.5 hover:bg-[var(--theme-muted-surface)]">试听</button>
            </div>
          </div>

          {/* Section 4: Danger Zone / Reset */}
          <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-800">学习进度重置</div>
              <div className="text-[11px] text-rose-600/80 mt-0.5">清空已拼句子记录重新开荒</div>
            </div>

            <button
              onClick={handleConfirmReset}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              重置记录
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[var(--theme-border)] flex items-center justify-between">
          {isSavedNotice ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>设置已保存！</span>
            </span>
          ) : (
            <span className="text-[11px] text-[var(--theme-muted)]">
              设置将自动保存在当前浏览器本地中
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-[var(--theme-text)] text-xs font-bold border border-[var(--theme-border)] cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-2xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)] text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>

    </ModalOverlay>
  );
};
