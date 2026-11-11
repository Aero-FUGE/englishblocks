import { ModalOverlay } from './ModalOverlay';
import React, { useState, useEffect, useRef } from 'react';
import { sound, SOUND_SLOTS, SoundSlotInfo } from '../utils/sound';
import { X, Play, Volume2, Upload, RotateCcw, Music, Sparkles, CheckCircle2 } from 'lucide-react';

interface SoundStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundStudioModal: React.FC<SoundStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSlotForUpload, setActiveSlotForUpload] = useState<string | null>(null);
  const [customVersion, setCustomVersion] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [sfxVolume,setSfxVolume] = useState(sound.sfxVolume);
  const [catVolume,setCatVolume] = useState(sound.catVolume);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setCustomVersion((v) => v + 1);
    };
    sound.setCustomSoundListener(handleSync);
    return () => {
      sound.setCustomSoundListener(() => {});
    };
  }, []);

  if (!isOpen) return null;

  const handleTestSlot = (slotId: string) => {
    sound.playSlot(slotId);
  };

  const handleTriggerUpload = (slotId: string) => {
    setActiveSlotForUpload(slotId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeSlotForUpload) {
      try { await sound.setCustomSound(activeSlotForUpload, file); } catch (error) { alert('音效保存失败，请检查浏览器存储权限：' + String(error)); }
      // Play newly imported sound to preview
      setTimeout(() => {
        sound.playSlot(activeSlotForUpload);
      }, 100);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveSlotForUpload(null);
  };

  const handleResetSlot = (slotId: string) => {
    sound.removeCustomSound(slotId);
    setTimeout(() => {
      sound.playSlot(slotId);
    }, 100);
  };

  const handleToggleSoundMaster = () => {
    sound.setMasterEnabled(!sound.enabled);
    setSoundEnabled(sound.enabled);
  };

  return (
    <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div role="dialog" aria-modal="true" aria-label="音效工作室" className="eb-modal-panel eb-modal-sound relative w-full max-w-2xl bg-[var(--theme-surface)] rounded-[36px] p-6 md:p-8 shadow-2xl border-4 border-[var(--theme-border)] z-10 flex flex-col max-h-[88vh] animate-scale-up">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎵</span>
            <div>
              <h3 className="font-candy text-xl font-bold text-[var(--theme-text)] flex items-center gap-2">
                <span>音效工作室</span>
                <span className="text-xs font-normal text-[var(--theme-text)] bg-[var(--theme-muted-surface)] px-2.5 py-0.5 rounded-full border border-[var(--theme-border)]">
                  小猫叫声系统 · 支持导入自定义音频
                </span>
              </h3>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                每个操作音效都能试听、更换。上传后自动保存，刷新页面不会丢失。
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

        <div className="eb-modal-body">
        {/* Master Sound Switch */}
        <div className="my-3.5 p-3.5 bg-white/90 rounded-2xl border border-[var(--theme-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[var(--theme-text)]" />
            <span className="text-xs md:text-sm font-bold text-[var(--theme-text)]">游戏按键与猫咪叫声音效总开关</span>
          </div>

          <button
            onClick={handleToggleSoundMaster}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-[var(--theme-primary)] text-white shadow-2xs'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {soundEnabled ? '音效已开启' : '音效已静音'}
          </button>
        </div>

        {/* Independent persistent sound level controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {([['sfx','操作音效',sfxVolume,setSfxVolume],['cat','猫咪叫声',catVolume,setCatVolume]] as const).map(([kind,label,value,setter])=>(
            <label key={kind} className="rounded-2xl border border-[var(--theme-border)] bg-white/90 p-3 flex flex-col gap-2 text-xs font-bold text-[var(--theme-text)]">
              <span className="flex justify-between"><span>{label}音量</span><span>{Math.round(value*100)}%</span></span>
              <input aria-label={`${label}音量`} type="range" min="0" max="100" value={Math.round(value*100)} onChange={e=>{const v=Number(e.target.value)/100;setter(v);sound.setEffectsVolume(kind,v);}} className="w-full accent-[var(--theme-primary)]" />
            </label>
          ))}
        </div>
        {/* Sound Slots List */}
        <div className="space-y-2.5 pr-1.5">
          {SOUND_SLOTS.map((slot: SoundSlotInfo) => {
            const isCustom = sound.isSlotCustom(slot.id);
            const customName = sound.getSlotCustomName(slot.id);

            return (
              <div
                key={`${slot.id}_${customVersion}`}
                className={`
                  p-3.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3
                  ${
                    isCustom
                      ? 'bg-[var(--theme-muted-surface)] border-[var(--theme-border)] shadow-2xs'
                      : 'bg-white/80 hover:bg-white border-[var(--theme-border)]'
                  }
                `}
              >
                {/* Slot Details */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-candy font-bold text-sm text-[var(--theme-text)]">
                      {slot.name}
                    </span>
                    {isCustom ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>已自定义: {customName}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--theme-text)] bg-[var(--theme-muted-surface)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full font-medium">
                        {slot.defaultLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--theme-muted)]">{slot.desc}</p>
                </div>

                {/* Actions: Test / Upload / Reset */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Test Button */}
                  <button
                    data-sound-preview onClick={() => handleTestSlot(slot.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-text)] shadow-2xs active:scale-95 transition-all cursor-pointer"
                    title="试听此音效"
                  >
                    <Play className="w-3 h-3 fill-[var(--theme-primary)] ml-0.5" />
                    <span>试听</span>
                  </button>

                  <button onClick={()=>{sound.setSlotMuted(slot.id,!sound.isSlotMuted(slot.id));setCustomVersion(v=>v+1)}} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${sound.isSlotMuted(slot.id)?'bg-rose-50 text-rose-700 border-rose-200':'bg-white text-[var(--theme-text)] border-[var(--theme-border)]'}`}>{sound.isSlotMuted(slot.id)?'已静音 · 开启':'静音'}</button>
                  {/* Import Custom Audio Button */}
                  <button
                    onClick={() => handleTriggerUpload(slot.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                    title="导入我的音频文件 (MP3/WAV/OGG...)"
                  >
                    <Upload className="w-3 h-3 stroke-[2.2]" />
                    <span>{isCustom ? '更换音频' : '导入音频'}</span>
                  </button>

                  {/* Reset to Default Kitten Sound */}
                  {isCustom && (
                    <button
                      onClick={() => handleResetSlot(slot.id)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 active:scale-95 transition-colors cursor-pointer"
                      title="恢复为默认小猫叫声"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        </div>
        {/* Bottom Tip */}
        <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between text-xs text-[var(--theme-muted)]">
          <div className="flex items-center gap-1.5">
            <span>💡</span>
            <span>导入音效会自动保存在本浏览器。设置 → 导出备份，也能把音效一并带走。</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)] active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            完成设定
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};
