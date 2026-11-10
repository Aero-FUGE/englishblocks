import {saveAudio,loadAudio,removeAudio} from './audioStore';
import { MascotEmotion, BgmTrack } from '../types/game';

export interface SoundSlotInfo {
  id: string;
  name: string;
  desc: string;
  defaultLabel: string;
}

export const SOUND_SLOTS: SoundSlotInfo[] = [
  { id: 'ui_button', name: '全局按钮 · 打开与关闭', desc: '衣柜、关卡目录、学习统计、音效工作室及弹窗按钮的统一点击音', defaultLabel: '全局按钮.wav（已内置）' },
  { id: 'block_place', name: '词块放入轨道', desc: '点击词块或拖入组装轨道时的反馈音', defaultLabel: '泡泡.wav（内置）' },
  { id: 'block_remove', name: '词块移回词库', desc: '点击轨道中的词块移回词库时的反馈音', defaultLabel: '可爱的按钮.wav（内置）' },
  { id: 'sentence_victory', name: '句子拼对通关', desc: '成功组装出符合中文意思的英语句子时的胜利音', defaultLabel: '小成功.wav（内置）' },
  { id: 'sentence_wobble', name: '句子拼错提示', desc: '拼错检查时词块轻轻摇晃的提示音', defaultLabel: '错误.wav（内置）' },
  { id: 'mimi_happy', name: '咪咪开心叫声', desc: '咪咪翻译官心情愉悦、给出肯定时的叫声', defaultLabel: '喵开心.wav（内置）' },
  { id: 'mimi_puzzled', name: '咪咪疑惑叫声', desc: '语序还在探索中或话未说完时的好奇探头叫声', defaultLabel: '疑惑.wav（内置）' },
  { id: 'mimi_shocked', name: '咪咪震惊叫声', desc: '语序颠倒或动词抢跑时的猫咪惊讶声', defaultLabel: '离谱.wav（内置）' },
  { id: 'mimi_speechless', name: '咪咪无语叫声', desc: '拼出离谱语序时的叹气死鱼眼小猫叫', defaultLabel: '哼傲娇.wav（内置）' },
  { id: 'mimi_celebrating', name: '咪咪庆祝叫声', desc: '大通关与点击咪咪互动时的狂喜连叫', defaultLabel: '惊喜完成.wav（内置）' },
];

interface CustomSoundData {
  name: string;
  url: string;
  audio: HTMLAudioElement;
}

// Stable IDs keep selected tracks and renamed titles across updates and backups.
const BUNDLED_BGM = [
  {
    "id": "bundled_9d6a2253271f",
    "title": "Alexis Ffrench - Reverie",
    "file": "Alexis Ffrench - Reverie.mp3"
  },
  {
    "id": "bundled_3ec38620453c",
    "title": "CMJ - 涟漪",
    "file": "CMJ - 涟漪.mp3"
  },
  {
    "id": "bundled_711596c49986",
    "title": "CMJ - 花日",
    "file": "CMJ - 花日.mp3"
  },
  {
    "id": "bundled_a449bbf68a74",
    "title": "ConcernedApe - Spring (Wild Horseradish Jam)",
    "file": "ConcernedApe - Spring (Wild Horseradish Jam).mp3"
  },
  {
    "id": "bundled_598004a085cc",
    "title": "Furyl - 春日小径花园Spring Alley Garden",
    "file": "Furyl - 春日小径花园Spring Alley Garden.mp3"
  },
  {
    "id": "bundled_0e0a0f272698",
    "title": "JINBAO - 日暮里",
    "file": "JINBAO - 日暮里.mp3"
  },
  {
    "id": "bundled_b47a66b984c6",
    "title": "Kryust - 晚霞",
    "file": "Kryust - 晚霞.mp3"
  },
  {
    "id": "bundled_4977de083b2e",
    "title": "Rain_13",
    "file": "Rain_13.wav"
  },
  {
    "id": "bundled_42137333ed4e",
    "title": "Siren - 冬青树",
    "file": "Siren - 冬青树.mp3"
  },
  {
    "id": "bundled_c27b985bf170",
    "title": "Youzee Music - 春禾",
    "file": "Youzee Music - 春禾.mp3"
  },
  {
    "id": "bundled_9d0404777e01",
    "title": "恋与深空 - 和你的每一天",
    "file": "恋与深空 - 和你的每一天.mp3"
  },
  {
    "id": "bundled_527fabffb898",
    "title": "恋与深空 - 沉坠的冠冕",
    "file": "恋与深空 - 沉坠的冠冕.mp3"
  },
  {
    "id": "bundled_9455bcc1f403",
    "title": "恋与深空 - 深空命轨",
    "file": "恋与深空 - 深空命轨.mp3"
  },
  {
    "id": "bundled_3395a5f36cfe",
    "title": "恋与深空 - 融雪之处",
    "file": "恋与深空 - 融雪之处.mp3"
  },
  {
    "id": "bundled_ccc29a4a75d0",
    "title": "恋与深空 - 霁雪和弦",
    "file": "恋与深空 - 霁雪和弦.mp3"
  },
  {
    "id": "bundled_ea7ebd1f4548",
    "title": "恋与深空 - 飞鸟回还日·无尽夏",
    "file": "恋与深空 - 飞鸟回还日·无尽夏.mp3"
  },
  {
    "id": "bundled_15d46b346ce0",
    "title": "时空储蓄罐 - Glacier（冰川）",
    "file": "时空储蓄罐 - Glacier（冰川）.mp3"
  },
  {
    "id": "bundled_213849824115",
    "title": "时空储蓄罐 - Luminous（流光纪）",
    "file": "时空储蓄罐 - Luminous（流光纪）.mp3"
  },
  {
    "id": "bundled_86d6fe600edc",
    "title": "时空储蓄罐 - 二手快乐",
    "file": "时空储蓄罐 - 二手快乐.mp3"
  },
  {
    "id": "bundled_ae36a378e9bf",
    "title": "时空储蓄罐 - 缓释胶囊",
    "file": "时空储蓄罐 - 缓释胶囊.mp3"
  }
];

// Web Audio API Kitten Synthesizer, Custom Audio Slot Import Engine, and BGM Manager
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public setMasterEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try { localStorage.setItem('english_blocks_sound_enabled_v1', String(enabled)); } catch {}
  }
  public speechEnabled: boolean = true;

  // Purchased Chinese-named WAV files are shipped as static assets.
  // User uploads still take priority, so custom choices remain possible.
  private readonly bundledSounds: Record<string,string> = {
    block_place:'泡泡', block_remove:'可爱的按钮', sentence_victory:'小成功',
    sentence_wobble:'错误', mimi_happy:'喵开心', mimi_puzzled:'疑惑',
    mimi_shocked:'离谱', mimi_speechless:'哼傲娇', mimi_celebrating:'惊喜完成',
    ui_button:'全局按钮', ui_open:'全局按钮', hint:'疑惑2',
    cat_unhappy:'不开心', cat_angry:'生气', cat_proud:'哼傲娇',
    reward:'惊喜完成'
  };
  private mutedSlots: Record<string,boolean> = (()=>{try{return JSON.parse(localStorage.getItem('english_blocks_muted_slots_v1')||'{}')}catch{return {}}})();
  public isSlotMuted(id:string){return !!this.mutedSlots[id];}
  public setSlotMuted(id:string,muted:boolean){this.mutedSlots[id]=muted;try{localStorage.setItem('english_blocks_muted_slots_v1',JSON.stringify(this.mutedSlots));}catch{}}
  public sfxVolume: number = 0.7;
  public catVolume: number = 0.35;
  private isCatSlot(slotId:string):boolean { return slotId.startsWith('mimi_') || slotId.startsWith('cat_'); }
  public setEffectsVolume(kind:'sfx'|'cat', value:number) {
    const level=Math.max(0,Math.min(1,value));
    if(kind==='cat')this.catVolume=level;else this.sfxVolume=level;
    try{localStorage.setItem('english_blocks_audio_levels_v1',JSON.stringify({sfx:this.sfxVolume,cat:this.catVolume}));}catch{}
  }
  private getEffectsVolume(slotId:string):number {return this.isCatSlot(slotId)?this.catVolume:this.sfxVolume;}
  private bundledPlayers: Record<string,HTMLAudioElement> = {};
  private preloadBundled(slotId: string): void {
    const name = this.bundledSounds[slotId];
    if (!name || typeof window === 'undefined' || this.bundledPlayers[slotId]) return;
    const player = new Audio('./assets/audio/sfx/' + encodeURIComponent(name) + '.wav');
    player.preload = 'auto';
    player.load();
    this.bundledPlayers[slotId] = player;
  }
  private playBundled(slotId:string):boolean {
    const name=this.bundledSounds[slotId];
    if (!name || typeof window==='undefined') return false;
    try {
      let player=this.bundledPlayers[slotId];
      if(!player){this.preloadBundled(slotId);player=this.bundledPlayers[slotId];}
      if (!player) return false;
      player.pause();player.volume=this.getEffectsVolume(slotId);player.currentTime=0;
      void player.play().catch(()=>{});
      return true;
    } catch {return false;}
  }

  // Custom User Sound Effects Registry
  public customSounds: Record<string, CustomSoundData> = {};
  private onCustomSoundsChange: (() => void) | null = null;
  private readonly CUSTOM_SOUND_NAMES_KEY = 'english_blocks_custom_sound_names_v1';
  private soundNames: Record<string, string> = {};
  private pendingSoundWrites = new Set<Promise<void>>();
  public async waitForAudioWrites(): Promise<void> { await Promise.all(this.pendingSoundWrites); }
  public speechRate: number = 0.9;
  public speechGender: 'female' | 'male' = 'female';
  public speechVoiceId: string = '';
  public speechVolume: number = 1;
  public autoReadOnSuccess: boolean = true;
  private voices: SpeechSynthesisVoice[] = [];
  private voiceListener: (() => void) | null = null;
  private speechRequest = 0;
  private activeSpeech: SpeechSynthesisUtterance | null = null;
  private readonly SPEECH_SETTINGS_KEY = 'english_blocks_speech_settings_v2';
  private speechPrimed = false;

  private readonly femaleVoiceHints = /(?:\bfemale\b|\bwoman\b|samantha|zira|jenny|aria|ava|allison|susan|karen|victoria|moira|fiona|tessa|siri female|serena|kate|hazel|salli|joanna|ivy|emma|amy|nicole|kimberly|kendra|raveena|natalie|olivia|linda|veena|美玲|女声|女性)/i;
  private readonly maleVoiceHints = /(?:\bmale\b|\bman\b|david|daniel|alex|aaron|george|thomas|james|richard|mark|guy|fred|oliver|arthur|ryan|matthew|brian|joey|justin|kevin|eric|john|peter|jack|henry|男声|男性)/i;
  private prepareSpeechVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      this.voices = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('en'));
      this.voiceListener?.();
    };
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    // On some browsers the list arrives after first interaction.
    window.setTimeout(updateVoices, 300);
  }
  private primeSpeechEngine(): void {
    if (this.speechPrimed || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.speechPrimed = true;
    try {
      const synth = window.speechSynthesis;
      synth.getVoices();
      if (synth.paused) synth.resume();
      const warmup = new SpeechSynthesisUtterance(' ');
      warmup.volume = 0;
      warmup.rate = 1;
      synth.speak(warmup);
      window.setTimeout(() => { try { if (synth.pending && !synth.speaking) synth.cancel(); } catch {} }, 60);
    } catch {}
  }
  private installSpeechWarmupListeners(): void {
    if (typeof window === 'undefined') return;
    const prime = () => {
      this.primeSpeechEngine();
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
      window.removeEventListener('touchstart', prime);
    };
    window.addEventListener('pointerdown', prime, { passive: true, once: true });
    window.addEventListener('keydown', prime, { once: true });
    window.addEventListener('touchstart', prime, { passive: true, once: true });
  }
  public getAvailableEnglishVoices(): {id:string;name:string;lang:string;local:boolean}[] {
    return this.voices.map(v=>({id:v.voiceURI,name:v.name,lang:v.lang,local:v.localService}));
  }
  public setSpeechVoiceListener(listener: (()=>void) | null) { this.voiceListener = listener; }
  private saveSpeechSettings() {
    try { localStorage.setItem(this.SPEECH_SETTINGS_KEY, JSON.stringify({
      rate:this.speechRate, gender:this.speechGender, voiceId:this.speechVoiceId, volume:this.speechVolume,
      autoReadOnSuccess:this.autoReadOnSuccess, enabled:this.speechEnabled,
    })); } catch {}
  }
  public setSpeechRate(rate:number) {
    if (!Number.isFinite(rate)) return;
    this.speechRate=Math.max(0.6,Math.min(1.4,rate));this.saveSpeechSettings();
  }
  public setSpeechGender(gender:'female'|'male') {
    this.speechGender=gender;this.speechVoiceId='';this.saveSpeechSettings();
  }
  public setSpeechVoice(id:string) {
    this.speechVoiceId=id;this.saveSpeechSettings();
  }
  public setSpeechVolume(volume:number) {
    if (!Number.isFinite(volume)) return;
    this.speechVolume=Math.max(0,Math.min(1,volume));this.saveSpeechSettings();
  }
  public setAutoReadOnSuccess(value:boolean) {this.autoReadOnSuccess=value;this.saveSpeechSettings();}
  public setSpeechEnabled(value:boolean) {this.speechEnabled=value;this.saveSpeechSettings();}
  private pickEnglishVoice(): SpeechSynthesisVoice | null {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.voices.length===0) {
      this.voices=window.speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('en'));
    }
    if (this.speechVoiceId) {
      const selected = this.voices.find(v=>v.voiceURI===this.speechVoiceId);
      if (selected) return selected;
    }
    const hints=this.speechGender==='male'?this.maleVoiceHints:this.femaleVoiceHints;
    const candidates=this.voices.filter(v=>hints.test(v.name));
    // Prefer an explicitly identified voice of the requested style; prefer local
    // voices to avoid network latency. Browsers do not expose reliable gender metadata.
    return candidates.find(v=>v.localService&&v.lang.toLowerCase()==='en-us')
      || candidates.find(v=>v.localService)
      || candidates.find(v=>v.lang.toLowerCase()==='en-us')
      || candidates[0]
      || this.voices.find(v=>v.localService&&v.lang.toLowerCase()==='en-us')
      || this.voices.find(v=>v.localService)
      || this.voices.find(v=>v.lang.toLowerCase()==='en-us')
      || this.voices[0] || null;
  }
  public getSelectedVoiceLabel(): string {
    const voice=this.pickEnglishVoice();
    return voice ? `${voice.name} (${voice.lang}${voice.localService?' · 本地':''})` : '使用浏览器默认英语语音';
  }
  private async restoreSavedSoundEffects(): Promise<void> {
    for (const [slotId, name] of Object.entries(this.soundNames)) {
      if (this.customSounds[slotId]) continue;
      try {
        const blob = await loadAudio('sfx:' + slotId);
        if (blob && !this.customSounds[slotId]) this.attachCustomSound(slotId, blob, name);
      } catch (error) { console.warn('无法恢复音效', slotId, error); }
    }
    this.notifyCustomSoundChange();
  }
  private attachCustomSound(slotId: string, file: Blob, name: string): void {
    const previous = this.customSounds[slotId];
    if (previous) { previous.audio.pause(); URL.revokeObjectURL(previous.url); }
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.preload = 'auto';
    this.customSounds[slotId] = { name, url, audio };
  }

  // BGM State & Playlist
  public bgmPlaying: boolean = false;
  public bgmVolume: number = 0.35;
  public bgmMode: 'single' | 'list' = 'single';
  public customAudio: HTMLAudioElement | null = null;
  public tracks: BgmTrack[] = [
    {
      id: 'builtin_music_box',
      title: '治愈钢琴 · 午后阳光 ♬',
      isBuiltIn: true,
    },
    ...BUNDLED_BGM.map(track => ({
      id: track.id, title: track.title, isBuiltIn: true,
      url: './assets/audio/bgm/' + encodeURIComponent(track.file),
    })),
  ];
  public currentTrackId: string = 'builtin_music_box';
  private bgmIntervalId: number | null = null;
  private bgmProceduralSteps = 0;
  private onBgmStateChange: (() => void) | null = null;
  public bgmRestoring = true;
  public bgmLoading = false;
  public bgmError: string | null = null;
  private bgmRequestId = 0;
  private activeAudioTrackId: string | null = null;
  private readonly BGM_SETTINGS_KEY = 'english_blocks_bgm_settings_v1';

  constructor() {
    if (typeof window !== 'undefined') {
      try { const levels=JSON.parse(localStorage.getItem('english_blocks_audio_levels_v1')||'{}'); if(typeof levels.sfx==='number')this.sfxVolume=Math.max(0,Math.min(1,levels.sfx)); if(typeof levels.cat==='number')this.catVolume=Math.max(0,Math.min(1,levels.cat)); }catch{}
      try {
        const savedTracks = localStorage.getItem('word_candy_bgm_tracks_v1');
        if (savedTracks) {
          const parsed = JSON.parse(savedTracks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const bundledIds = new Set(this.tracks.map(t => t.id));
            this.tracks = [
              ...this.tracks.map(track => ({...track, title: parsed.find((t:BgmTrack) => t.id === track.id)?.title || track.title})),
              ...parsed.filter((t:BgmTrack) => !bundledIds.has(t.id)).map((t:BgmTrack) => t.isBuiltIn ? t : {...t, url: undefined}),
            ];
          }
        }
      } catch {}
      try {
        const settings = JSON.parse(localStorage.getItem(this.BGM_SETTINGS_KEY) || '{}');
        if (typeof settings.volume === 'number' && Number.isFinite(settings.volume)) {
          this.bgmVolume = Math.max(0, Math.min(1, settings.volume));
        }
        this.bgmMode = settings.mode === 'list' ? 'list' : 'single';
        if (typeof settings.currentTrackId === 'string' && this.tracks.some(t => t.id === settings.currentTrackId)) {
          this.currentTrackId = settings.currentTrackId;
        } else {
          // V7 did not persist the selected song. Prefer the last uploaded custom song.
          this.currentTrackId = [...this.tracks].reverse().find(t => !t.isBuiltIn)?.id || 'builtin_music_box';
        }
      } catch { this.currentTrackId = [...this.tracks].reverse().find(t => !t.isBuiltIn)?.id || 'builtin_music_box'; }
      try { this.soundNames = JSON.parse(localStorage.getItem(this.CUSTOM_SOUND_NAMES_KEY) || '{}'); } catch { this.soundNames = {}; }
      this.enabled = localStorage.getItem('english_blocks_sound_enabled_v1') !== 'false';
      try {
        const speechSettings=JSON.parse(localStorage.getItem(this.SPEECH_SETTINGS_KEY)||'{}');
        this.speechRate=typeof speechSettings.rate==='number'&&Number.isFinite(speechSettings.rate)?Math.max(0.6,Math.min(1.4,speechSettings.rate)):0.9;
        this.speechGender=speechSettings.gender==='male'?'male':'female';
        this.speechVoiceId=typeof speechSettings.voiceId==='string'?speechSettings.voiceId:'';
        this.speechVolume=typeof speechSettings.volume==='number'&&Number.isFinite(speechSettings.volume)?Math.max(0,Math.min(1,speechSettings.volume)):1;
        this.autoReadOnSuccess=speechSettings.autoReadOnSuccess!==false;
        this.speechEnabled=speechSettings.enabled!==false;
      }catch{}
      this.preloadBundled('ui_button');
      this.prepareSpeechVoices();
      this.installSpeechWarmupListeners();
      void this.restoreSavedAudio();
      void this.restoreSavedSoundEffects();
    }
  }

  private async restoreSavedAudio() {
    // Restore the selected song first. Do not display a playing animation until
    // its actual audio element has successfully started playback.
    const selected = this.tracks.find(t => t.id === this.currentTrackId);
    const ordered = selected ? [selected, ...this.tracks.filter(t => t.id !== selected.id)] : this.tracks;
    try {
      for (const track of ordered) {
        if (track.isBuiltIn || track.url) continue;
        try {
          const blob = await loadAudio(track.id);
          if (blob && this.tracks.includes(track)) track.url = URL.createObjectURL(blob);
          if (!blob && track.id === this.currentTrackId) {
            this.bgmError = '这首 BGM 的音频文件未保存在备份中，请重新导入原曲。';
          }
        } catch (error) {
          if (track.id === this.currentTrackId) this.bgmError = '无法读取背景音乐，请检查浏览器存储权限。';
          console.warn('无法恢复已上传的背景音乐', track.title, error);
        } finally {
          if (track.id === this.currentTrackId) {
            this.bgmRestoring = false;
            this.notifyBgmChange();
          }
        }
      }
    } finally {
      this.bgmRestoring = false;
      this.notifyBgmChange();
    }
  }

  public setCustomSoundListener(callback: () => void) {
    this.onCustomSoundsChange = callback;
  }

  private notifyCustomSoundChange() {
    if (this.onCustomSoundsChange) {
      this.onCustomSoundsChange();
    }
  }

  public setBgmListener(callback: () => void) {
    this.onBgmStateChange = callback;
  }

  private notifyBgmChange() {
    if (this.onBgmStateChange) {
      this.onBgmStateChange();
    }
    try {
      localStorage.setItem('word_candy_bgm_tracks_v1', JSON.stringify(this.tracks.map(t=>({...t,url:undefined}))));
      localStorage.setItem(this.BGM_SETTINGS_KEY, JSON.stringify({ currentTrackId: this.currentTrackId, volume: this.bgmVolume, mode: this.bgmMode }));
    } catch {}
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ----------------------------------------------------
  // Custom Sound Slots Management
  // ----------------------------------------------------

  public async setCustomSound(slotId: string, file: File): Promise<void> {
    if (!file.type.startsWith('audio/') && !/\.(wav|mp3|m4a|ogg|flac)$/i.test(file.name)) {
      throw new Error('请选择音频文件');
    }
    const name = file.name.replace(/\.[^/.]+$/, '');
    const write = saveAudio('sfx:' + slotId, file);
    this.pendingSoundWrites.add(write);
    try {
      await write; // Show "saved" only after IndexedDB commit succeeds.
      this.attachCustomSound(slotId, file, name);
      this.soundNames[slotId] = name;
      localStorage.setItem(this.CUSTOM_SOUND_NAMES_KEY, JSON.stringify(this.soundNames));
      this.notifyCustomSoundChange();
    } finally { this.pendingSoundWrites.delete(write); }
  }

  public removeCustomSound(slotId: string) {
    const previous = this.customSounds[slotId];
    if (previous) { previous.audio.pause(); URL.revokeObjectURL(previous.url); }
    delete this.customSounds[slotId];
    delete this.soundNames[slotId];
    localStorage.setItem(this.CUSTOM_SOUND_NAMES_KEY, JSON.stringify(this.soundNames));
    const write = removeAudio('sfx:' + slotId);
    this.pendingSoundWrites.add(write);
    void write.catch(error => console.warn('无法移除音效', error)).finally(() => { this.pendingSoundWrites.delete(write); });
    this.notifyCustomSoundChange();
  }

  public isSlotCustom(slotId: string): boolean {
    return Boolean(this.customSounds[slotId]);
  }

  public getSlotCustomName(slotId: string): string | null {
    return this.customSounds[slotId]?.name || null;
  }

  public playSlot(slotId: string) {
    if (!this.enabled || this.isSlotMuted(slotId)) return;
    // If user uploaded custom audio for this slot, play it!
    if (this.customSounds[slotId]) {
      try {
        const audio = this.customSounds[slotId].audio;
        audio.volume = this.getEffectsVolume(slotId);
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      } catch {}
    }

    if (this.playBundled(slotId)) return;

    // Otherwise play default kitten synthesized voice
    switch (slotId) {
      case 'block_place':
        this.playKittenMewShort();
        break;
      case 'block_remove':
        this.playKittenPurrPop();
        break;
      case 'sentence_victory':
        this.playKittenVictoryMeow();
        break;
      case 'sentence_wobble':
        this.playKittenWobbleWuu();
        break;
      case 'mimi_happy':
        this.playMascotHappy();
        break;
      case 'mimi_puzzled':
        this.playMascotPuzzled();
        break;
      case 'mimi_shocked':
        this.playMascotShocked();
        break;
      case 'mimi_speechless':
        this.playMascotSpeechless();
        break;
      case 'mimi_celebrating':
        this.playMascotCelebrating();
        break;
    }
  }

  // ----------------------------------------------------
  // Default Sweet Kitten Meow Synthesizers
  // ----------------------------------------------------

  // 1. Block Place: Sweet high kitten "mew~"
  playPop(pitchModifier = 1) {
    if(this.isSlotMuted('block_place'))return;
    if (!this.enabled) return;
    if (!this.customSounds['block_place'] && this.playBundled('block_place')) return;
    if (this.customSounds['block_place']) {
      this.playSlot('block_place');
      return;
    }
    this.playKittenMewShort(pitchModifier);
  }

  public playKittenMewShort(pitchModifier = 1) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Soft kitten pitch contour: start mid, glide up, settle soft
      osc.type = 'sine';
      const base = 580 * pitchModifier;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.35, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(base * 1.1, now + 0.12);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // 2. Block Remove: Soft kitten purr pop
  playSnap() {
    if(this.isSlotMuted('block_remove'))return;
    if (!this.enabled) return;
    if (!this.customSounds['block_remove'] && this.playBundled('block_remove')) return;
    if (this.customSounds['block_remove']) {
      this.playSlot('block_remove');
      return;
    }
    this.playKittenPurrPop();
  }

  public playKittenPurrPop() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  // 3. Sentence Wobble (Error): Sad kitten "wuu~"
  playWobble() {
    if (!this.enabled) return;
    if (!this.customSounds['sentence_wobble'] && this.playBundled('sentence_wobble')) return;
    if (this.customSounds['sentence_wobble']) {
      this.playSlot('sentence_wobble');
      return;
    }
    this.playKittenWobbleWuu();
  }

  public playKittenWobbleWuu() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.12);
      osc.frequency.linearRampToValueAtTime(210, now + 0.28);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.34);
    } catch {}
  }

  // 4. Shuffle
  playShuffle() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [440, 520, 620, 740];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = this.ctx!.currentTime + idx * 0.035;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.08);
      });
    } catch {}
  }

  // 5. Sentence Victory: Kitten joyful triple meow + bell fanfare
  playVictory() {
    if (!this.enabled) return;
    if (!this.customSounds['sentence_victory'] && this.playBundled('sentence_victory')) return;
    if (this.customSounds['sentence_victory']) {
      this.playSlot('sentence_victory');
      return;
    }
    this.playKittenVictoryMeow();
  }

  public playKittenVictoryMeow() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const meowNotes = [659.25, 783.99, 1046.5]; // E5, G5, C6

      meowNotes.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const t = now + i * 0.11;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f * 0.9, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.15, t + 0.08);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.24, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.24);
      });

      // Extra purr chime
      setTimeout(() => {
        try {
          if (!this.ctx) return;
          const bell = this.ctx.createOscillator();
          const bellGain = this.ctx.createGain();
          bell.type = 'triangle';
          bell.frequency.setValueAtTime(1318.51, this.ctx.currentTime);
          bellGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          bellGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
          bell.connect(bellGain);
          bellGain.connect(this.ctx.destination);
          bell.start();
          bell.stop(this.ctx.currentTime + 0.55);
        } catch {}
      }, 340);
    } catch {}
  }

  // ----------------------------------------------------
  // Mimi Cat Mascot Emotion Voices
  // ----------------------------------------------------

  // 1. Happy: Sweet kitten "miao~"
  playMascotHappy() {
    if (!this.enabled) return;
    if (!this.customSounds['mimi_happy'] && this.playBundled('mimi_happy')) return;
    if (this.customSounds['mimi_happy']) {
      this.playSlot('mimi_happy');
      return;
    }
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.25);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  // 2. Puzzled: Curious questioning kitten squeak "mrr-oow?"
  playMascotPuzzled() {
    if (!this.enabled) return;
    if (!this.customSounds['mimi_puzzled'] && this.playBundled('mimi_puzzled')) return;
    if (this.customSounds['mimi_puzzled']) {
      this.playSlot('mimi_puzzled');
      return;
    }
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.2);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  // 3. Shocked: Startled cat jump "nyaa-k!"
  playMascotShocked() {
    if (!this.enabled) return;
    if (!this.customSounds['mimi_shocked'] && this.playBundled('mimi_shocked')) return;
    if (this.customSounds['mimi_shocked']) {
      this.playSlot('mimi_shocked');
      return;
    }
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.22);

      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  // 4. Speechless: Flat sigh cat purr "purr-flat"
  playMascotSpeechless() {
    if (!this.enabled) return;
    if (!this.customSounds['mimi_speechless'] && this.playBundled('mimi_speechless')) return;
    if (this.customSounds['mimi_speechless']) {
      this.playSlot('mimi_speechless');
      return;
    }
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [380, 340, 290];

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + idx * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + 0.14);
      });
    } catch {}
  }

  // 5. Celebrating: Joyful kitten purring flurry
  playMascotCelebrating() {
    if (!this.enabled) return;
    if (!this.customSounds['mimi_celebrating'] && this.playBundled('mimi_celebrating')) return;
    if (this.customSounds['mimi_celebrating']) {
      this.playSlot('mimi_celebrating');
      return;
    }
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const arpeggio = [580, 720, 880, 1100, 1320];

      arpeggio.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + i * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {}
  }

  playMascotEmotion(emotion: MascotEmotion) {
    switch (emotion) {
      case 'happy':
        this.playMascotHappy();
        break;
      case 'puzzled':
        this.playMascotPuzzled();
        break;
      case 'shocked':
        this.playMascotShocked();
        break;
      case 'speechless':
        this.playMascotSpeechless();
        break;
      case 'celebrating':
        this.playMascotCelebrating();
        break;
    }
  }

  // ----------------------------------------------------
  // BGM Engine
  // ----------------------------------------------------

  public get currentTrack(): BgmTrack | undefined {
    return this.tracks.find((t) => t.id === this.currentTrackId) || this.tracks[0];
  }

  private playBgmNote(freq: number, duration = 0.5) {
    if (!this.ctx || !this.bgmPlaying || (!this.currentTrack?.isBuiltIn || !!this.currentTrack?.url)) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const noteVolume = 0.15 * this.bgmVolume;
      gain.gain.setValueAtTime(noteVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  private startProceduralBgm() {
    this.stopProceduralBgm();
    this.initCtx();

    const melodySeq = [
      523.25, 659.25, 783.99, 659.25,
      587.33, 523.25, 440.00, 523.25,
      659.25, 783.99, 880.00, 783.99,
      659.25, 587.33, 523.25, 392.00,
    ];
    this.bgmProceduralSteps=0;
    this.bgmIntervalId = window.setInterval(() => {
      if (!this.bgmPlaying || (!this.currentTrack?.isBuiltIn || !!this.currentTrack?.url)) return;
      const step=this.bgmProceduralSteps++;
      this.playBgmNote(melodySeq[step % melodySeq.length], 0.45);
      if (step % 4 === 0) this.playBgmNote(step % 8 === 0 ? 261.63 : 220, 0.8);
      // The built-in tune is procedural, so give it a finite verse in list mode.
      if (this.bgmMode==='list' && this.tracks.length>1 && this.bgmProceduralSteps>=64) {
        this.advanceBgm(1);
      }
    }, 420);
  }

  private stopProceduralBgm() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  /** Cancel any pending play() promise before pausing or changing tracks. */
  private stopBgmAudio() {
    this.bgmRequestId++;
    this.bgmLoading = false;
    this.bgmPlaying = false;
    this.stopProceduralBgm();
    if (this.customAudio) this.customAudio.pause();
  }

  public toggleBgm() {
    if (this.bgmPlaying || this.bgmLoading) this.pauseBgm();
    else { void this.startBgm(); }
  }
  public setBgmMode(mode:'single'|'list') {
    this.bgmMode=mode;
    if (this.customAudio) this.customAudio.loop=mode==='single';
    this.notifyBgmChange();
  }
  /** A song with no saved file is skipped during automatic playlist playback. */
  public advanceBgm(direction:1|-1=1) {
    const len=this.tracks.length;
    if (!len) return;
    const index=Math.max(0,this.tracks.findIndex(t=>t.id===this.currentTrackId));
    let next=this.tracks[index];
    for(let offset=1;offset<=len;offset++) {
      const candidate=this.tracks[(index+direction*offset+len*(offset+1))%len];
      if(candidate.isBuiltIn||!!candidate.url) {next=candidate;break;}
    }
    this.stopBgmAudio();
    this.currentTrackId=next.id;
    this.bgmError=null;
    this.notifyBgmChange();
    void this.startBgm();
  }

  /** Set playing=true only AFTER the real audio actually starts. */
  public async startBgm(): Promise<void> {
    if (this.bgmPlaying || this.bgmLoading) return;
    const track = this.currentTrack;
    if (!track) return;
    const requestId = ++this.bgmRequestId;
    this.bgmError = null;

    if (track.isBuiltIn && !track.url) {
      try {
        this.initCtx();
        if (!this.ctx) throw new Error('当前浏览器不支持音频播放');
        await this.ctx.resume();
        if (requestId !== this.bgmRequestId) return;
        this.bgmPlaying = true;
        this.startProceduralBgm();
      } catch {
        if (requestId === this.bgmRequestId) this.bgmError = '背景音乐未能启动，请再点一次播放。';
      }
      if (requestId === this.bgmRequestId) this.notifyBgmChange();
      return;
    }

    // Hydration may still be in progress right after restoring a JSON backup.
    // Never pretend playback started when there is no playable audio URL.
    if (!track.url) {
      if (this.bgmRestoring) {
        this.bgmError = '正在恢复音乐文件，请稍后再点播放。';
      } else {
        this.bgmError = '找不到这首音乐的原始音频，请在 BGM 歌单中重新导入。';
      }
      this.notifyBgmChange();
      return;
    }

    this.bgmLoading = true;
    this.notifyBgmChange();
    try {
      if (this.activeAudioTrackId !== track.id || !this.customAudio || this.customAudio.src !== track.url) {
        if (this.customAudio) this.customAudio.pause();
        this.customAudio = new Audio(track.url);
        this.customAudio.loop = this.bgmMode==='single';
        this.customAudio.preload = 'auto';
        this.activeAudioTrackId = track.id;
        const audio = this.customAudio;
        audio.addEventListener('ended', () => {
          if (this.customAudio !== audio || this.bgmMode!=='list') return;
          this.advanceBgm(1);
        });
        audio.addEventListener('error', () => {
          if (this.customAudio !== audio) return;
          this.bgmPlaying = false;
          this.bgmLoading = false;
          this.bgmError = '音频解码失败，请确认是浏览器支持的 MP3、WAV 等格式。';
          this.notifyBgmChange();
        });
      }
      this.customAudio.loop = this.bgmMode==='single';
      if (this.customAudio.ended) this.customAudio.currentTime=0;
      this.customAudio.volume = this.bgmVolume;
      await this.customAudio.play();
      if (requestId !== this.bgmRequestId) {
        this.customAudio.pause();
        return;
      }
      this.bgmPlaying = true;
    } catch (error) {
      if (requestId !== this.bgmRequestId) return;
      this.bgmPlaying = false;
      const err = error instanceof Error ? error : new Error(String(error));
      this.bgmError = err.name === 'NotAllowedError'
        ? '浏览器拦截了自动播放，请点击播放按钮再试。'
        : '这首 BGM 播放失败，请检查文件格式，或删除后重新导入。';
      console.warn('BGM 播放失败', track.title, err);
    } finally {
      if (requestId === this.bgmRequestId) {
        this.bgmLoading = false;
        this.notifyBgmChange();
      }
    }
  }

  public pauseBgm() {
    try { localStorage.setItem('english_blocks_bgm_autoplay_v31', 'off'); } catch {}
    this.stopBgmAudio();
    this.notifyBgmChange();
  }

  public setVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.customAudio) this.customAudio.volume = this.bgmVolume;
    this.notifyBgmChange();
  }

  /** Selecting a track starts it, unless its audio is missing. */
  public selectTrack(trackId: string) {
    if (!this.tracks.some(t => t.id === trackId)) return;
    if (this.currentTrackId === trackId && this.bgmPlaying) return;
    this.stopBgmAudio();
    this.currentTrackId = trackId;
    this.bgmError = null;
    const track = this.currentTrack;
    this.notifyBgmChange();
    if (track && !track.isBuiltIn && !track.url) {
      // A just-imported song may have finished loading in IndexedDB but not
      // yet been hydrated. Load it here and ask for a new user gesture to play.
      this.bgmLoading = true;
      this.notifyBgmChange();
      const requestId = ++this.bgmRequestId;
      void loadAudio(track.id).then(blob => {
        if (requestId !== this.bgmRequestId) return;
        if (!blob) { this.bgmError = '没有找到这首音乐的音频文件，请重新导入。'; return; }
        track.url = URL.createObjectURL(blob);
        this.bgmError = '音乐已准备好，点击播放按钮即可收听。';
      }).catch(() => {
        if (requestId === this.bgmRequestId) this.bgmError = '背景音乐读取失败，请重新导入。';
      }).finally(() => {
        if (requestId === this.bgmRequestId) { this.bgmLoading = false; this.notifyBgmChange(); }
      });
      return;
    }
    void this.startBgm();
  }

  public addCustomTrack(file: File, selectAfterImport=true): string {
    if ((!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name)) || file.size === 0) {
      throw new Error('请选择有效的音频文件（MP3 / WAV 等）');
    }
    const fileUrl = URL.createObjectURL(file);
    const newId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const rawTitle = file.name.replace(/\.[^/.]+$/, '');
    const newTrack: BgmTrack = {
      id: newId,
      title: rawTitle,
      url: fileUrl,
      isBuiltIn: false,
      addedAt: Date.now(),
    };

    this.tracks.push(newTrack);
    // Previously the backup exporter only waited for SFX writes, so exporting
    // immediately after adding music could silently omit its audio bytes.
    const write = saveAudio(newId, file);
    this.pendingSoundWrites.add(write);
    void write.catch(error => {
      this.bgmError = `「${rawTitle}」没能保存到浏览器。导出备份前请检查存储空间。`;
      console.error('背景音乐保存失败', error);
      this.notifyBgmChange();
    }).finally(() => this.pendingSoundWrites.delete(write));
    if(selectAfterImport)this.selectTrack(newId);
    this.notifyBgmChange();
    return newId;
  }

  public renameTrack(trackId: string, newTitle: string) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track && newTitle.trim()) {
      track.title = newTitle.trim();
      this.notifyBgmChange();
    }
  }

  public deleteTrack(trackId: string) {
    if (this.tracks.find(t => t.id === trackId)?.isBuiltIn) return;
    const idx = this.tracks.findIndex(t => t.id === trackId);
    if (idx < 0) return;
    const removed = this.tracks[idx];
    if (this.currentTrackId === trackId) {
      this.stopBgmAudio();
      this.currentTrackId = 'builtin_music_box';
    }
    if (this.activeAudioTrackId === trackId) {
      this.customAudio?.pause();
      this.customAudio = null;
      this.activeAudioTrackId = null;
    }
    if (removed.url?.startsWith('blob:')) URL.revokeObjectURL(removed.url);
    void removeAudio(trackId).catch(error => console.warn('无法清除背景音乐文件', error));
    this.tracks.splice(idx, 1);
    this.notifyBgmChange();
  }

  // Speech synthesis is device-dependent. Resolve the available local voice before
  // speaking; do not keep cancelling and retrying an idle engine on every click.
  speakText(text: string, rate?: number) {
    if (!text.trim() || !this.speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth=window.speechSynthesis;
    this.primeSpeechEngine();
    if (synth.paused) synth.resume();
    const request=++this.speechRequest;
    try {
      // Cancel only a genuinely active request. Rapid repeat clicks should play
      // the last word rather than lining up a long queue.
      if (synth.speaking || synth.pending || synth.paused) synth.cancel();
      const utterance=new SpeechSynthesisUtterance(text);
      utterance.lang='en-US';
      utterance.rate=rate??this.speechRate;
      utterance.pitch=1;
      utterance.volume=this.speechVolume;
      const selected=this.pickEnglishVoice();
      if(selected) {utterance.voice=selected;utterance.lang=selected.lang;}
      this.activeSpeech=utterance;
      let started=false;
      utterance.onstart=()=>{started=true;};
      utterance.onend=()=>{if(this.activeSpeech===utterance)this.activeSpeech=null;};
      utterance.onerror=()=>{if(this.activeSpeech===utterance)this.activeSpeech=null;};
      synth.speak(utterance);
      if(synth.paused) synth.resume();
      // Only recover an actually stuck engine. Never insert an unconditional
      // timer between the user's click and the first speak() call.
      window.setTimeout(()=>{
        if(request!==this.speechRequest||started||this.activeSpeech!==utterance)return;
        // If speech is still queued after a significant delay, retry ONCE with
        // the browser default (often installed locally, avoids remote latency).
        try {
          synth.cancel();
          const fallback=new SpeechSynthesisUtterance(text);
          fallback.lang='en-US';fallback.rate=rate??this.speechRate;fallback.volume=this.speechVolume;
          this.activeSpeech=fallback;
          fallback.onend=()=>{if(this.activeSpeech===fallback)this.activeSpeech=null;};
          fallback.onerror=()=>{if(this.activeSpeech===fallback)this.activeSpeech=null;};
          synth.speak(fallback);
        } catch(error) {console.warn('英语语音引擎重试失败',error);}
      }, 2600);
    } catch(error) {console.warn('浏览器朗读失败',error);}
  }

}

export const sound = new SoundManager();
