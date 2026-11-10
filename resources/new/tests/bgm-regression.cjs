const { strict: assert } = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

const store = new Map([
  ['word_candy_bgm_tracks_v1', JSON.stringify([{id:'builtin_music_box',title:'钢琴',isBuiltIn:true},{id:'saved_song',title:'收藏的音乐',isBuiltIn:false}])],
  ['english_blocks_bgm_settings_v1', JSON.stringify({currentTrackId:'saved_song',volume:0.55})],
]);
let failPlayback = false;
class FakeAudio {
  constructor(src) { this.src = src; this.loop = false; this.paused = true; this.preload = 'auto'; this.volume = 1; this.listeners = {}; }
  async play() { if (failPlayback) throw Object.assign(new Error('cannot play'),{name:'NotSupportedError'}); this.paused=false; }
  pause(){ this.paused = true; }
  load(){}
  addEventListener(type,fn){this.listeners[type]=fn;}
}
const savedBlob = new Blob(['fake music data'],{type:'audio/mpeg'});
const moduleExports = {};
const sandbox = {
  exports:moduleExports,
  require(name){
    if(name === './audioStore')return { loadAudio: async id=>id==='saved_song'?savedBlob:undefined, saveAudio: async()=>{},removeAudio:async()=>{} };
    throw new Error('Unexpected module '+name);
  },
  window: {setInterval,clearInterval,setTimeout,clearTimeout,addEventListener(){},removeEventListener(){}},
  Audio: FakeAudio,
  localStorage: {getItem:key=>store.get(key)??null, setItem:(key,value)=>store.set(key,value)},
  URL, Blob, console, setTimeout, clearTimeout, setInterval, clearInterval,
};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'english-blocks-bgm-test-'));
execFileSync('tsc', ['--ignoreConfig','src/utils/sound.ts','src/utils/audioStore.ts','src/types/game.ts','--module','commonjs','--target','es2020','--lib','es2020,dom','--skipLibCheck','--outDir',tmp], {stdio:'pipe'});
const code = fs.readFileSync(path.join(tmp,'utils/sound.js'),'utf8');
fs.rmSync(tmp, {recursive:true,force:true});
vm.runInNewContext(code,sandbox,{filename:'sound.cjs'});
const sound=moduleExports.sound;
const wait=()=>new Promise(resolve=>setTimeout(resolve,15));
(async()=>{
  await wait();
  assert.equal(sound.currentTrackId,'saved_song','selected song restored');
  assert.equal(sound.bgmVolume,0.55,'volume restored');
  assert.ok(sound.currentTrack.url?.startsWith('blob:'),'audio bytes restored into a real blob URL');
  failPlayback=true;
  await sound.startBgm();
  assert.equal(sound.bgmPlaying,false,'failed play never shows playing');
  assert.ok(sound.bgmError?.includes('播放失败'),'play failure visible');
  failPlayback=false;
  await sound.startBgm();
  assert.equal(sound.bgmPlaying,true,'successful audio play shows playing');
  assert.equal(sound.bgmError,null,'success clears previous errors');
  sound.pauseBgm();
  assert.equal(sound.bgmPlaying,false,'pause changes status');
  sound.setVolume(0.27);
  assert.equal(JSON.parse(store.get('english_blocks_bgm_settings_v1')).volume,0.27,'volume persisted');
  sound.selectTrack('saved_song');
  await wait();
  assert.equal(sound.bgmPlaying,true,'selecting song starts playback');
  sound.pauseBgm();
  console.log('PASS: selected music, restored blob, volume persistence, playback failure, recovery, pause/select');
})().catch(err=>{console.error(err);process.exitCode=1;});
