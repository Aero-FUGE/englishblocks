import { useModalScrollLock } from './ModalOverlay';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { sound } from '../utils/sound';
import { BgmTrack } from '../types/game';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  Disc3,
  Edit2,
  Check,
  Trash2,
  Plus,
  SkipBack,
  SkipForward,
  Repeat,
  ListMusic,
} from 'lucide-react';

interface BgmPlayerWidgetProps {
  className?: string;
}

export const BgmPlayerWidget: React.FC<BgmPlayerWidgetProps> = ({ className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(sound.bgmPlaying);
  const [isLoading, setIsLoading] = useState(sound.bgmLoading || sound.bgmRestoring);
  const [playbackError, setPlaybackError] = useState<string | null>(sound.bgmError);
  const [volume, setVolume] = useState(sound.bgmVolume);
  const [currentTrackId, setCurrentTrackId] = useState(sound.currentTrackId);
  const [bgmMode, setBgmMode] = useState(sound.bgmMode);
  const [tracks, setTracks] = useState<BgmTrack[]>([...sound.tracks]);
  const [isOpenPanel, setIsOpenPanel] = useState(false);
  useModalScrollLock(isOpenPanel);

  // Rename state
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setIsPlaying(sound.bgmPlaying);
      setIsLoading(sound.bgmLoading || sound.bgmRestoring);
      setPlaybackError(sound.bgmError);
      setVolume(sound.bgmVolume);
      setCurrentTrackId(sound.currentTrackId);
      setBgmMode(sound.bgmMode);
      setTracks([...sound.tracks]);
    };
    sound.setBgmListener(handleSync);
    return () => {
      sound.setBgmListener(() => {});
    };
  }, []);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) || tracks[0];

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.toggleBgm();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    sound.setVolume(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      let lastImported: string | null = null;
      for (const file of Array.from(files)) {
        try { lastImported = sound.addCustomTrack(file, false); }
        catch (error) { window.alert(error instanceof Error ? error.message : '音频导入失败'); }
      }
      // Import many songs without starting playback for every file.
      if (lastImported) sound.selectTrack(lastImported);
      setTracks([...sound.tracks]);
      setCurrentTrackId(sound.currentTrackId);
      setBgmMode(sound.bgmMode);
    }
    e.target.value = ''; // Allow uploading the same file again after deletion.
  };

  const handleSelectTrack = (trackId: string) => {
    sound.selectTrack(trackId);
  };

  const handleStartRename = (track: BgmTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrackId(track.id);
    setEditingTitle(track.title);
  };

  const handleSaveRename = (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editingTitle.trim()) {
      sound.renameTrack(trackId, editingTitle.trim());
      setTracks([...sound.tracks]);
    }
    setEditingTrackId(null);
  };

  const handleDeleteTrack = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.deleteTrack(trackId);
    setTracks([...sound.tracks]);
    setCurrentTrackId(sound.currentTrackId);
  };

  return (
    <div className={`eb-bgm-widget relative w-[216px] shrink-0 ${className}`}>
      {/* Hidden File Input for Custom BGM upload (multiple files allowed!) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Compact Top Bar Trigger Button */}
      <div className="flex w-full min-w-0 items-center gap-1.5 bg-white hover:bg-amber-50/80 border-2 border-amber-200/90 rounded-full px-3 py-1 shadow-xs transition-colors">
        {/* Play / Pause button */}
        <button
          onClick={handleTogglePlay}
          aria-label={isPlaying ? '暂停背景音乐' : isLoading ? '音乐加载中' : '播放背景音乐'}
          className="w-6 h-6 rounded-full bg-amber-400 hover:bg-amber-500 active:scale-95 text-amber-950 flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
          title={isPlaying ? '暂停背景音乐' : isLoading ? '音乐正在从存档恢复' : '播放背景音乐'}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 fill-amber-950" />
          ) : (
            <Play className="w-3 h-3 fill-amber-950 ml-0.5" />
          )}
        </button>

        {/* Current Track Name (Click to open playlist) */}
        <button
          onClick={() => setIsOpenPanel(!isOpenPanel)}
          className="flex flex-1 min-w-0 items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
          title="点击打开多首音乐歌单与导入"
        >
          <Disc3
            className={`w-3.5 h-3.5 text-amber-600 shrink-0 ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '4s' }}
          />
          <span className="block min-w-0 flex-1 truncate text-left" title={currentTrack?.title}>{currentTrack?.title || 'BGM 音乐'}</span>
        </button>

        {/* Open Playlist modal button */}
        <button
          onClick={() => setIsOpenPanel(!isOpenPanel)}
          className="w-5 h-5 rounded-full hover:bg-amber-100/70 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors ml-0.5 cursor-pointer"
          title="音乐歌单管理"
        >
          <Music className="w-3 h-3 text-amber-700" />
        </button>
      </div>

      {/* Keep feedback out of the flex layout so the whole BGM pill never jumps. */}
      {(playbackError || (isLoading && currentTrack && !currentTrack.isBuiltIn)) && !isOpenPanel && (
        <div role="status" className={`absolute top-full right-0 z-40 mt-1.5 w-72 max-w-[80vw] rounded-xl border px-3 py-2 text-xs shadow-md ${playbackError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {playbackError || '正在从本地存档加载背景音乐…'}
        </div>
      )}
      {/* Floating Multi-track BGM Playlist Panel */}
      {isOpenPanel && createPortal(
        <div className="fixed inset-0 z-[1000] bg-black/25" onClick={() => setIsOpenPanel(false)} aria-hidden="true" />,
        document.body
      )}
      {isOpenPanel && createPortal(
        <div role="dialog" aria-modal="true" aria-label="BGM 歌单" className="eb-bgm-panel fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-w-[calc(100vw-24px)] max-h-[min(78dvh,660px)] overflow-y-auto bg-white rounded-3xl p-4 shadow-2xl border-3 border-amber-200 z-[1001] animate-scale-up text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-100">
            <div className="flex items-center gap-2 font-candy font-bold text-slate-800 text-sm md:text-base">
              <Disc3 className="w-4 h-4 text-amber-500" />
              <span>BGM 音乐歌单库 ({tracks.length} 首)</span>
            </div>
            <button
              onClick={() => setIsOpenPanel(false)}
              aria-label="关闭音乐歌单"
              className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          </div>

          {(playbackError || isLoading) && (
            <div role="status" className="mb-3 rounded-xl bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900">
              {playbackError || '正在读取已保存的背景音乐…'}
            </div>
          )}
          {/* Volume Control Slider */}
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 mb-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                {volume > 0 ? (
                  <Volume2 className="w-4 h-4 text-amber-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span>BGM 播放音量</span>
              </span>
              <span className="font-mono text-xs text-amber-800 font-bold">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-amber-200/60 rounded-lg"
            />
          </div>

          {/* Playback mode and previous/next song, persisted with BGM settings. */}
          <div className="rounded-2xl border border-[#E6D9BD] bg-[#FFFBF1] p-3 mb-3 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button type="button" aria-pressed={bgmMode==='single'} onClick={()=>sound.setBgmMode('single')} title="单曲循环"
                  className={`rounded-full w-9 h-9 grid place-items-center border transition ${bgmMode==='single'?'bg-amber-400 border-amber-400 text-[#6C4A17] shadow-sm':'bg-white border-[#EADDC4] text-[#9A8B6F] hover:bg-amber-50'}`}>
                  <Repeat className="h-4 w-4"/>
                </button>
                <button type="button" aria-pressed={bgmMode==='list'} onClick={()=>sound.setBgmMode('list')} title="列表循环"
                  className={`rounded-full w-9 h-9 grid place-items-center border transition ${bgmMode==='list'?'bg-amber-400 border-amber-400 text-[#6C4A17] shadow-sm':'bg-white border-[#EADDC4] text-[#9A8B6F] hover:bg-amber-50'}`}>
                  <ListMusic className="h-4 w-4"/>
                </button>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button type="button" onClick={()=>sound.advanceBgm(-1)} title="上一首" aria-label="上一首" className="rounded-full w-9 h-9 grid place-items-center bg-white border border-amber-200 hover:bg-amber-50"><SkipBack className="w-4 h-4 text-[#98703D]"/></button>
                <button type="button" onClick={()=>sound.toggleBgm()} title={isPlaying?'暂停':'播放'} aria-label={isPlaying?'暂停':'播放'} className="rounded-full w-12 h-12 grid place-items-center bg-amber-400 text-[#63431B] hover:bg-amber-500 shadow-sm">
                  {isPlaying ? <Pause className="w-4 h-4 fill-[#63431B]" /> : <Play className="w-4 h-4 fill-[#63431B] ml-0.5" />}
                </button>
                <button type="button" onClick={()=>sound.advanceBgm(1)} title="下一首" aria-label="下一首" className="rounded-full w-9 h-9 grid place-items-center bg-white border border-amber-200 hover:bg-amber-50"><SkipForward className="w-4 h-4 text-[#98703D]"/></button>
              </div>
            </div>
            <p className="text-[11px] text-[#9B8D71] leading-snug">{bgmMode==='list'?'会按歌单顺序接着播放。':'当前歌曲会重复播放。'}</p>
          </div>

          {/* Playlist Section */}
          <div className="eb-bgm-list mb-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5 px-1">
              <span>曲目列表 (点击选择播放 · 支持重命名)：</span>
            </div>

            <div className="eb-bgm-tracks max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {tracks.map((track) => {
                const isSelected = track.id === currentTrackId;
                const isEditing = editingTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track.id)}
                    className={`
                      group p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2
                      ${
                        isSelected
                          ? 'bg-amber-100/70 border-amber-400 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }
                    `}
                  >
                    {/* Track info & rename input */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isSelected && isPlaying ? (
                          <Disc3 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 ml-0.5" />
                        )}
                      </div>

                      {isEditing ? (
                        <div
                          className="flex items-center gap-1 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="w-full text-xs font-bold px-2 py-1 border border-amber-400 rounded-lg outline-none bg-white"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(track.id);
                            }}
                          />
                          <button
                            onClick={(e) => handleSaveRename(track.id, e)}
                            className="p-1 rounded-md bg-amber-400 hover:bg-amber-500 text-amber-950"
                            title="保存名称"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="truncate flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {track.title}
                          </div>
                          <div className={`text-[10px] ${!track.isBuiltIn && !track.url && !isLoading ? 'text-rose-600' : 'text-slate-400'}`}>
                            {track.isBuiltIn ? (track.url ? '内置背景音乐' : '内置治愈旋律') : track.url ? '自定义导入音乐' : isLoading ? '正在恢复音乐文件…' : '音频丢失 · 请重新导入'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions: Rename & Delete */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Rename button */}
                        <button
                          onClick={(e) => handleStartRename(track, e)}
                          className="w-6 h-6 rounded-full hover:bg-white/80 flex items-center justify-center text-slate-400 hover:text-amber-700 transition-colors"
                          title="修改音乐名称"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Delete button (only for custom tracks) */}
                        {!track.isBuiltIn && (
                          <button
                            onClick={(e) => handleDeleteTrack(track.id, e)}
                            className="w-6 h-6 rounded-full hover:bg-rose-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
                            title="从歌单删除此音乐"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Import New Music Button */}
          <div className="pt-2 border-t border-amber-100">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-98 text-amber-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all candy-btn cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>导入新的背景音乐 (支持多首 MP3/WAV)</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
