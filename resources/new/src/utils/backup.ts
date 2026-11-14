import {validMusicProgress} from '../../shared/music-history.mjs';
import { exportAudioBackup, importAudioBackup } from './audioStore';
import { sound } from './sound';

const PROFILE_KEY = 'word_candy_single_profile_v3';
const CONFIG_KEYS = [
  'english_blocks_cat_collection_v1',
  'english_blocks_muted_slots_v1',
  'english_blocks_audio_levels_v1',
  'english_blocks_sound_enabled_v1',
  'english_blocks_custom_sound_names_v1',
  'word_candy_bgm_tracks_v1',
  'english_blocks_bgm_settings_v1',
  'english_blocks_speech_settings_v1',
];
const FULL_KEYS = [PROFILE_KEY, ...CONFIG_KEYS];
type BackupKind = 'full' | 'share';

/** Both export kinds bundle IndexedDB audio blobs as base64, not short-lived blob: URLs. */
export async function downloadBackup(kind: BackupKind = 'full') {
  // Ensure uploads that just finished in the UI are committed before exporting.
  await sound.waitForAudioWrites();
  const saved: Record<string, string | null> = {};
  const keys = kind === 'full' ? FULL_KEYS : CONFIG_KEYS;
  for (const key of keys) saved[key] = localStorage.getItem(key);
  // Music history is learning progress, even though it shares collection storage.
  if(kind==='share'&&saved.english_blocks_cat_collection_v1){const c=JSON.parse(saved.english_blocks_cat_collection_v1!);delete c.musicHistory;saved.english_blocks_cat_collection_v1=JSON.stringify(c);}
  const audio = await exportAudioBackup();
  const savedTracks = JSON.parse(saved['word_candy_bgm_tracks_v1'] || '[]');
  if (Array.isArray(savedTracks)) {
    const audioIds = new Set(audio.map(entry => entry.id));
    const missing = savedTracks.filter(track => track && !track.isBuiltIn && !audioIds.has(track.id));
    if (missing.length) {
      throw new Error(`${missing.length} 首自定义背景音乐没有保存原始音频（例如「${missing[0].title}」）。请在 BGM 歌单中重新导入原曲后再导出备份，避免分享后无声。`);
    }
  }
  const payload = {
    format: 'english-blocks-backup', version: 2, kind, createdAt: new Date().toISOString(),
    saved, audio,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], {type: 'application/json'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = `英语拼块${kind === 'share' ? '设置备份' : '完整备份'}-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function restoreBackup(file: File) {
  const payload = JSON.parse(await file.text());
  if (payload?.format !== 'english-blocks-backup' || ![1, 2].includes(payload.version)
      || !payload.saved || typeof payload.saved !== 'object' || !Array.isArray(payload.audio)) {
    throw new Error('备份文件格式不正确');
  }
  const kind: BackupKind = payload.version === 2 && payload.kind === 'share' ? 'share' : 'full';
  const keys = kind === 'share' ? CONFIG_KEYS : FULL_KEYS;
  for (const key of keys) {
    const value = payload.saved[key];
    if (value != null && typeof value !== 'string') throw new Error('备份数据格式不正确');
  }
  if(kind==='full'&&payload.saved.english_blocks_cat_collection_v1){const c=JSON.parse(payload.saved.english_blocks_cat_collection_v1);if(c.musicHistory!=null&&!validMusicProgress(c.musicHistory))throw Error('音乐史学习记录格式不正确，原存档未替换');}
  // Import binary audio first, then metadata: refreshed page will restore both.
  const rawTracks = payload.saved['word_candy_bgm_tracks_v1'];
  const tracks = rawTracks ? JSON.parse(rawTracks) : [];
  const importedAudioIds = new Set(payload.audio.map((entry: {id:string}) => entry.id));
  const unavailable = Array.isArray(tracks) ? tracks.filter((track: {id:string;isBuiltIn:boolean}) =>
    track && !track.isBuiltIn && !importedAudioIds.has(track.id)
  ) : [];
  await importAudioBackup(payload.audio);
  for (const key of keys) {
    if (typeof payload.saved[key] === 'string') {
      if(kind==='share'&&key==='english_blocks_cat_collection_v1'){
        const c=JSON.parse(payload.saved[key]);const current=JSON.parse(localStorage.getItem(key)||'{}');delete c.musicHistory;
        if(current.musicHistory)c.musicHistory=current.musicHistory;localStorage.setItem(key,JSON.stringify(c));
      }else localStorage.setItem(key, payload.saved[key]);
    }
    // An older backup has no selected BGM, so do not retain a stale device-local choice.
    else if (key === 'english_blocks_bgm_settings_v1') localStorage.removeItem(key);
  }
  if (unavailable.length) {
    window.alert(`学习记录和设置已导入，但备份缺少 ${unavailable.length} 首 BGM 的原始音频。请在音乐歌单中重新导入这些曲目，才能播放。`);
  }
  // A settings-only backup never overwrites the receiver's own learning progress.
  window.location.reload();
}
